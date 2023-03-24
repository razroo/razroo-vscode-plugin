import { ProjectConfig } from '../projects/interfaces/project-config.interfaces';
import * as vscode from 'vscode';
import AdmZip from 'adm-zip';
import * as fse from 'fs-extra';
import {
  removeVsCodeInstanceMutation,
  subscribeToGenerateVsCodeDownloadCodeSub,
  updatePrivateDirectoriesRequest,
  auth0Client
} from './graphql.utils';
import {
  getFileS3,
} from './request.utils';
import { COMMAND_AUTH0_AUTH, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_REFRESH_TOKEN, MEMENTO_RAZROO_USER_ID, MEMENTO_RAZROO_ORG_ID, PROD_APP_URL, DEV_APP_URL, MEMENTO_SELECTED_PROJECTS } from '../constants';
// import parseGitignore from 'parse-gitignore';
import process from 'process';
import { editFiles } from './edit.utils';
import { filterIgnoredDirs, getWorkspaceFolders } from './directory.utils';
import { isTokenExpired } from './date/date.utils';
import { integrationTestGeneratedFiles, unitTestGeneratedFiles } from './test.utils';
import path, { join, extname, normalize} from 'path';
import { determineFilePathParameter, effects, getVersionAndNameString, replaceCurlyBrace, getAllDirectoriesFromVsCodeFolder } from '@codemorph/core';
import {  runRazrooCommand } from './command/command';
import { writeCodeSnippet } from '../snippets/write-snippet';
import { createVSCodeIdToken } from './token/token';

const showInformationMessage = vscode.window.showInformationMessage;

export const validateEmail = (email: string) => {
  const res =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return res.test(String(email).toLowerCase()) ? undefined : email;
};

export const saveFiles = async (
  data: any,
  context: vscode.ExtensionContext,
  isProduction: boolean,
  path: string
) => {
  const url = data.data.generateVsCodeDownloadCodeSub.downloadUrl;
  // parameters will always be a string <-- architected specifically this way
  const parameters = data.data.generateVsCodeDownloadCodeSub?.parameters;
  const templateParameters = data.data.generateVsCodeDownloadCodeSub?.template.parameters;
  const type = data.data.generateVsCodeDownloadCodeSub.template.type;
  const template = data.data.generateVsCodeDownloadCodeSub.template;
  const updates = data.data.generateVsCodeDownloadCodeSub?.template?.updates;
  const filesToGenerate = data.data.generateVsCodeDownloadCodeSub?.template?.filesToGenerate ? JSON.parse(data.data.generateVsCodeDownloadCodeSub?.template?.filesToGenerate) : {};

  //Get files of S3
  const files = await getFileS3({ url });
  const folderRoot = path;

  //#### TODO REFACTORING MAKE EDIT it's own thing right now inside code generation
  if (type === 'Edit' && updates) {
    editFiles(updates, parameters);
    return;
  }

  // Extract files from zip
  var zip = new AdmZip(files);
  const zipEntries = zip.getEntries();

  if (type === 'Snippet') {
    writeCodeSnippet(context, zipEntries[0], template, isProduction);
    return;
  }
  for await (const zipEntry of zipEntries) {
    const parametersParsed = JSON.parse(parameters);
    const fileNameandPath = normalize(replaceCurlyBrace(parametersParsed, zipEntry.entryName));
    const fileName = replaceCurlyBrace(parametersParsed, zipEntry.name);

    if (extname(fileName) === ".sh") {
      const commandToExecute = zipEntry.getData().toString("utf8");
      await runRazrooCommand(commandToExecute, parametersParsed,isProduction, template);
    }

    if (type !== 'edit' && extname(fileName) !== ".sh") {
      try {
        const fileData = zipEntry.getData().toString("utf8");
        const fullPathOfFile = join(folderRoot, fileNameandPath);
        await fse.outputFile(fullPathOfFile, fileData);
        const pathId = template.baseCommunityPath ? template.baseCommunityPath : template.pathId; 
        const coreProgrammingLanguage = getVersionAndNameString(pathId).name;
        const filePathParameter = determineFilePathParameter(zipEntry.entryName, templateParameters);
        effects(fullPathOfFile, filePathParameter, coreProgrammingLanguage, parameters);
        const razrooStepURL = `${isProduction ? PROD_APP_URL : DEV_APP_URL}/${template.orgId}/${template.pathId}/${template.recipeId}/${template.id}`;
        const openLinkCommand = {
          title: 'Open in Razroo',
          command: 'extension.openLink'
        };
        showInformationMessage(razrooStepURL,openLinkCommand).then(selection=>{
          if(selection && selection.command === 'extension.openLink') {
            vscode.env.openExternal(vscode.Uri.parse(`${razrooStepURL}`));
          };
        });
      } catch (error) {
        console.log('extractEntryTo', error);
      }
    }

    if(data.data.generateVsCodeDownloadCodeSub.runUnitTests) {
      let template = data.data.generateVsCodeDownloadCodeSub.template;
      await unitTestGeneratedFiles(fileNameandPath, folderRoot, template, context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN)!, isProduction);
    }
  
    if(data.data.generateVsCodeDownloadCodeSub.runIntegrationTests) {
      let template = data.data.generateVsCodeDownloadCodeSub.template;
      integrationTestGeneratedFiles(fileNameandPath, folderRoot, template, context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN)!, isProduction);
    }
  }
  
};

export const updatePrivateDirectoriesInVSCodeAuthentication = async (
  accessToken: string,
  isProduction: boolean,
  userId: string,
  orgId: string,
  selectedProjects: ProjectConfig[]
) => {
  for(let selectedProject of selectedProjects) {
    const vsCodeInstanceId = createVSCodeIdToken(userId, selectedProject.versionControlParams);
    // needs to use this path for directories
    const path = selectedProject.versionControlParams.path;
    const privateDirectories = path ? await getPrivateDirs(path) : [];

    const packageJsonParamsStringified = typeof selectedProject.packageJsonParams === 'object' ? JSON.stringify(selectedProject.packageJsonParams) : selectedProject.packageJsonParams;
    await updatePrivateDirectoriesRequest({
      vsCodeInstanceId,
      accessToken,
      privateDirectories,
      isProduction,
      userId,
      orgId,
      packageJsonParams: packageJsonParamsStringified
    });
  }
};

const getPrivateDirs = async(fullPath: string) => {
  const name = path.basename(fullPath);
  const VsCodeFolder = {path: fullPath, name};
  // uses short code for map
  let dirs = [VsCodeFolder].map(getAllDirectoriesFromVsCodeFolder)?.flat() || [];
  if (process.platform === 'win32') {
    dirs = dirs.map((v: string) => v.replace(/\\/g, '/'));
  }
  // Remove the root directory from file path
  dirs = dirs.map(dir => {
    return dir.split('/').slice(1).join('/');
  });
  return filterIgnoredDirs(dirs);
};

export const onVSCodeClose = (context: vscode.ExtensionContext, isProduction: boolean, cancelAuthProgress?, progress?) => {
  const vsCodeInstanceId: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  const userId: string | undefined = context.globalState.get(MEMENTO_RAZROO_USER_ID);
  const accessToken: string | undefined = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  const refreshToken: string | undefined = context.globalState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  if (vsCodeInstanceId && userId && accessToken && refreshToken) {
    return removeVsCodeInstanceMutation(accessToken, userId, vsCodeInstanceId, isProduction)
      .catch((error: any) => console.log('Remove VSCode Instance Error: ', error))
      .finally(() => {
        if(progress) {
          cancelAuthProgress(progress);
        }    
      });
  } else {
    if(progress) {
      cancelAuthProgress(progress);
    }
    return;
  }
};

async function refreshAuth0Token(context, refreshToken, userId, orgId, isProduction: boolean, projectsProvider, selectedProjects) {
  return auth0Client(isProduction).refreshToken({ refresh_token: refreshToken }, async function (err, userData) {
    if (err) {
      vscode.commands.executeCommand(COMMAND_AUTH0_AUTH, {selectedProjects});
    }

    await context.workspaceState.update(MEMENTO_RAZROO_ACCESS_TOKEN, userData.access_token);
    await context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, userData.refresh_token);
    await updatePrivateDirectoriesInVSCodeAuthentication(userData.access_token, isProduction, userId, orgId, selectedProjects);
    await subscribeToGenerateVsCodeDownloadCodeSub({ context, isProduction, projectsProvider, selectedProjects, userId });
    vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
    showInformationMessage('User successfully authenticated with Razroo.');
    return userData;
  });
};

export const tryToAuth = async (context: vscode.ExtensionContext, isProduction: boolean, projectsProvider, projectConfigs: ProjectConfig[]) => {
  const accessToken: string | undefined = await context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  const refreshToken: string | undefined = await context.globalState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  const userId = await context.globalState.get(MEMENTO_RAZROO_USER_ID) as string;
  const orgId = await context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string;
  const selectedProjects = await context.workspaceState.get(MEMENTO_SELECTED_PROJECTS) as ProjectConfig[];
  if (accessToken && refreshToken && userId && orgId) {
    if(isTokenExpired(accessToken)) {
      await refreshAuth0Token(context, refreshToken, userId, orgId, isProduction, projectsProvider, selectedProjects);
      await projectsProvider?.view?.webview.postMessage({
        command: "initAuthData",
        projectConfigs,
        selectedProjects,
        userId,
        orgId,
      });
    }
    else {
      if(selectedProjects) {
        await updatePrivateDirectoriesInVSCodeAuthentication(context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN)!, isProduction, userId, orgId, selectedProjects);
        await subscribeToGenerateVsCodeDownloadCodeSub({ context, isProduction, projectsProvider, selectedProjects, userId});
      }
      vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
      await projectsProvider?.view?.webview.postMessage({
        command: "initAuthData",
        projectConfigs,
        selectedProjects,
        userId,
        orgId
      });
      showInformationMessage('User successfully connected to Razroo.');
    }
  } else {
    console.log('else block for orgId is called');
    await projectsProvider?.view?.webview.postMessage({
      command: "initAuthData",
      projectConfigs,
      selectedProjects,
      userId,
      orgId
    });
    vscode.commands.executeCommand(COMMAND_AUTH0_AUTH, {selectedProjects, projectConfigs});
  }
};
