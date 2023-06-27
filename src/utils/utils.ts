import { getUserOrganizations } from '../projects/organizations/organizations.service';
import { ProjectConfig } from '../projects/interfaces/project-config.interfaces';
import * as vscode from 'vscode';
import AdmZip from 'adm-zip';
import * as fse from 'fs-extra';
import {
  removeVsCodeInstanceMutation,
  subscribeToGenerateVsCodeDownloadCodeSub,
  updatePrivateDirectoriesRequest,
  setCommandStatus
} from './graphql.utils';
import {
  getFileS3,
} from './request.utils';
import { COMMAND_AUTH0_AUTH, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_REFRESH_TOKEN, MEMENTO_RAZROO_USER_ID, MEMENTO_RAZROO_ORG_ID, PROD_APP_URL, DEV_APP_URL, MEMENTO_SELECTED_PROJECTS, RAZROO_PREVIEW_STATE } from '../constants';
import process from 'process';
import { editFiles } from './edit.utils';
import { filterIgnoredDirs } from './directory.utils';
import { isTokenExpired } from './date/date.utils';
import { integrationTestGeneratedFiles, unitTestGeneratedFiles } from './test.utils';
import path, { join, extname, normalize} from 'path';
import { determineFilePathParameter, effects, getVersionAndNameString, replaceCurlyBrace, getAllDirectoriesFromVsCodeFolder } from '@codemorph/core';
import {  runRazrooCommand } from './command/command';
import { writeCodeSnippet } from '../snippets/write-snippet';
import { createVSCodeIdToken } from './token/token';
import { refreshAccessToken } from '../graphql/expired';
import { switchToActiveBranch } from '../preview/switch-branch';

const showInformationMessage = vscode.window.showInformationMessage;

export const validateEmail = (email: string) => {
  const res =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return res.test(String(email).toLowerCase()) ? undefined : email;
};

let menu = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
export const saveFiles = async (
  data: any,
  context: vscode.ExtensionContext,
  isProduction: boolean,
  path: string
) => {
  const url = data.downloadUrl;
  // parameters will always be a string <-- architected specifically this way
  const parameters = data?.parameters;
  const templateParameters = data?.template.parameters;
  const type = data.template.type;
  const template = data.template;
  const updates = data?.template?.updates;
  const filesToGenerate = data?.template?.filesToGenerate ? JSON.parse(data?.template?.filesToGenerate) : {};
  const runUnitTests = data.runUnitTests;
  // unitTestFileName - for use with running unit tests. Allows to extract unit test name and use once all files generated
  let unitTestFileName = '';
  const runIntegrationTests = data.runIntegrationTests;
  const runPreviewGeneration = data.runPreviewGeneration;

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

  for await (const [index, zipEntry] of zipEntries.entries()) {
    const parametersParsed = JSON.parse(parameters);
    const fileNameandPath = normalize(replaceCurlyBrace(parametersParsed, zipEntry.entryName, true));
    const fileName = replaceCurlyBrace(parametersParsed, zipEntry.name);

    if (extname(fileName) === ".sh") {
      setCommandStatus(false);
      const commandToExecute = zipEntry.getData().toString("utf8");
      if(runPreviewGeneration) {
        const previewStateObject = {
          templateOrgId: template.orgId,
          pathId: template.pathId,
          recipeId: template.recipeId,
          stepId: template.id,
          type: template.type,
          title: template.title,
        };
        menu.text = `$(rocket) Build Preview and Upload ${template.title}`;
        menu.command = 'extension.buildPreviewAndUpload';
        menu.show();
        
        await context.workspaceState.update(RAZROO_PREVIEW_STATE, previewStateObject);
      } else {
        menu.hide();
      }
      await runRazrooCommand(commandToExecute, parametersParsed,isProduction, template, runPreviewGeneration, folderRoot, context);
    }

    if (type !== 'edit' && extname(fileName) !== ".sh") {
      try {
        const fileData = zipEntry.getData().toString("utf8");
        const fullPathOfFile = join(folderRoot, fileNameandPath);
        await fse.outputFile(fullPathOfFile, fileData);
        const pathId = template.baseCommunityPath ? template.baseCommunityPath : template.pathId; 
        const coreProgrammingLanguage = getVersionAndNameString(pathId).name;
        const filePathParameter = determineFilePathParameter(zipEntry.entryName, templateParameters);
        if (fileNameandPath.includes(".spec")) {
          unitTestFileName = fileNameandPath;
        }
        if (index === zipEntries.length - 1) {
          try {
            effects(fullPathOfFile, filePathParameter, coreProgrammingLanguage, parameters);
          } catch (error) {
            console.error(`Error in effect: ${error}`);
          }
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

          if(runPreviewGeneration) {
            await switchToActiveBranch(template.orgId, template.pathId, template.recipeId, template.id);
            const previewStateObject = {
              templateOrgId: template.orgId,
              pathId: template.pathId,
              recipeId: template.recipeId,
              stepId: template.id,
              type: template.type,
              title: template.title,
            };
            menu.text = `$(rocket) Build Preview and Upload ${template.title}`;
            menu.command = 'extension.buildPreviewAndUpload';
            menu.show();
            
            await context.workspaceState.update(RAZROO_PREVIEW_STATE, previewStateObject);
          } else {
            menu.hide();
          }

          if(runUnitTests) {
            setTimeout(async () => {
              let template = data.template;
              await unitTestGeneratedFiles(unitTestFileName, folderRoot, template, context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN)!, isProduction);
            }, 1000);
          }
        
          if(runIntegrationTests) {
            let template = data.template;
            await integrationTestGeneratedFiles(fileNameandPath, folderRoot, template, context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN)!, isProduction);
          }
        }
      } catch (error) {
        console.log('extractEntryTo', error);
      }
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
    const vsCodeInstanceId = createVSCodeIdToken(userId, orgId, selectedProject.versionControlParams, selectedProject.packageJsonParams, selectedProject.folderName);
    // needs to use this path for directories
    const path = selectedProject.versionControlParams && selectedProject.versionControlParams.path;
    const absoluteFolderRoot = path && normalize(selectedProject.versionControlParams.path);
    const privateDirectories = path ? await getPrivateDirs(path) : [];

    const packageJsonParamsStringified = typeof selectedProject.packageJsonParams === 'object' ? JSON.stringify(selectedProject.packageJsonParams) : selectedProject.packageJsonParams;
    const versionControlParams = {
      gitBranch: selectedProject.versionControlParams && selectedProject.versionControlParams.gitBranch,
      gitOrigin: selectedProject.versionControlParams && selectedProject.versionControlParams.gitOrigin
    };
    await updatePrivateDirectoriesRequest({
      vsCodeInstanceId,
      accessToken,
      privateDirectories,
      isProduction,
      userId,
      orgId,
      packageJsonParams: packageJsonParamsStringified,
      versionControlParams,
      absoluteFolderRoot
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

export const tryToAuth = async (context: vscode.ExtensionContext, isProduction: boolean, projectsProvider, projectConfigs: ProjectConfig[], orgIdParam?: string) => {
  const accessToken: string | undefined = await context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  const refreshToken: string | undefined = await context.globalState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  const userId = await context.globalState.get(MEMENTO_RAZROO_USER_ID) as string;
  const orgId = orgIdParam ? orgIdParam : await context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string;
  const selectedProjects = await context.workspaceState.get(MEMENTO_SELECTED_PROJECTS) as ProjectConfig[];
  if (accessToken && refreshToken && userId && orgId) {
    if(isTokenExpired(accessToken)) {
      const newAccessToken = await refreshAccessToken(context, isProduction);
    }
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
    context.globalState.update(MEMENTO_RAZROO_ORG_ID, orgId);
    const userOrganizations = await getUserOrganizations(userId, isProduction, context);
    await projectsProvider?.view?.webview.postMessage({
      command: "setOrganizations",
      organizations: userOrganizations
    });
  } else {
    await projectsProvider?.view?.webview.postMessage({
      command: "initAuthData",
      projectConfigs,
      selectedProjects,
      userId,
      orgId
    });
    vscode.commands.executeCommand(COMMAND_AUTH0_AUTH, {selectedProjects, projectConfigs, orgId: orgIdParam});
  }
};
