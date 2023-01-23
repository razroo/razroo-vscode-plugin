import * as vscode from 'vscode';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
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
import { COMMAND_AUTH0_AUTH, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_REFRESH_TOKEN, MEMENTO_RAZROO_USER_ID, MEMENTO_RAZROO_ORG_ID } from '../constants';
// import parseGitignore from 'parse-gitignore';
import process from 'process';
import { editFiles } from './edit.utils';
import { filterIgnoredDirs, getWorkspaceFolders } from './directory.utils';
import { isTokenExpired } from './date/date.utils';
import { integrationTestGeneratedFiles, unitTestGeneratedFiles } from './test.utils';
import { join, extname, normalize} from 'path';
import { determineFilePathParameter, determineType, effects, getAllDirectoriesFromVsCodeFolder, getVersionAndNameString, replaceCurlyBrace } from '@razroo/razroo-codemod';
import { containsInfrastructureCommandPath, openWorkspaceInNewCodeEditor, runRazrooCommand } from './command/command';

const showInformationMessage = vscode.window.showInformationMessage;

export const validateEmail = (email: string) => {
  const res =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return res.test(String(email).toLowerCase()) ? undefined : email;
};

export const saveFiles = async (
  data: any,
  context: vscode.ExtensionContext
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
  const rootDirectory = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.path : '';
  const folderSelectedInWorkspace = join(rootDirectory);
  const folderRoot = `${folderSelectedInWorkspace}`;

  //#### TODO REFACTORING MAKE EDIT it's own thing right now inside code generation
  if (type === 'Edit' && updates) {
    editFiles(updates, parameters);
    return;
  }

  // Extract files from zip
  var zip = new AdmZip(files);
  const zipEntries = zip.getEntries();
  for await (const zipEntry of zipEntries) {
    const parametersParsed = JSON.parse(parameters);
    const fileNameandPath = normalize(replaceCurlyBrace(parametersParsed, zipEntry.entryName));
    const fileName = replaceCurlyBrace(parametersParsed, zipEntry.name);

    if (extname(fileName) === ".sh") {
      const commandToExecute = zipEntry.getData().toString("utf8");
      await runRazrooCommand(commandToExecute, parametersParsed);
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
        showInformationMessage('Files generated');
      } catch (error) {
        console.log('extractEntryTo', error);
      }
    }

    if(data.data.generateVsCodeDownloadCodeSub.runUnitTests) {
      let template = data.data.generateVsCodeDownloadCodeSub.template;
      await unitTestGeneratedFiles(fileNameandPath, folderRoot, template, context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN)!, context.extensionMode === 1);
    }
  
    if(data.data.generateVsCodeDownloadCodeSub.runIntegrationTests) {
      let template = data.data.generateVsCodeDownloadCodeSub.template;
      integrationTestGeneratedFiles(fileNameandPath, folderRoot, template, context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN)!, context.extensionMode === 1);
    }
  }
  
};

export const updatePrivateDirectoriesInVSCodeAuthentication = async (
  vsCodeToken: string,
  accessToken: string,
  isProduction: boolean,
  userId: string,
  orgId: string
) => {
  const privateDirectories = await getPrivateDirs();
  console.log("PRIV DIRECTORIES", privateDirectories);

  return updatePrivateDirectoriesRequest({
    vsCodeToken,
    accessToken,
    privateDirectories,
    isProduction,
    userId,
    orgId
  });
};

const getPrivateDirs = async () => {
  const workspaceFolders = getWorkspaceFolders();
  // uses short code for map
  let dirs = workspaceFolders?.map(getAllDirectoriesFromVsCodeFolder)?.flat() || [];
  if (process.platform === 'win32') {
    dirs = dirs.map((v: string) => v.replace(/\\/g, '/'));
  }
  // Remove the root directory from file path
  dirs = dirs.map(dir => {
    return dir.split('/').slice(1).join('/');
  });
  return filterIgnoredDirs(dirs);
};

export const onVSCodeClose = (context: vscode.ExtensionContext, cancelAuthProgress?, progress?) => {
  const isProduction = context.extensionMode === 1;
  const vsCodeInstanceId: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  const userId: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_USER_ID);
  const accessToken: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  const refreshToken: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  if (vsCodeInstanceId && userId && accessToken && refreshToken) {
    console.log('this is called as inside inside inside');
    return removeVsCodeInstanceMutation(accessToken, userId, vsCodeInstanceId, isProduction)
      .catch((error: any) => console.log('Remove VSCode Instance Error: ', error))
      .finally(() => {
        context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, null);
        context.workspaceState.update(MEMENTO_RAZROO_USER_ID, null);
        context.workspaceState.update(MEMENTO_RAZROO_ACCESS_TOKEN, null);
        context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, null);
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

async function refreshAuth0Token(context, refreshToken, userId, orgId, token) {
  let isProduction = context.extensionMode === 1;

  return auth0Client(isProduction).refreshToken({ refresh_token: refreshToken }, async function (err, userData) {
    if (err) {
      console.log("err: ", err);
      return err;
    }

    await context.workspaceState.update(MEMENTO_RAZROO_ACCESS_TOKEN, userData.access_token);
    await context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, userData.refresh_token);
    const isProduction = context.extensionMode === 1;
    await updatePrivateDirectoriesInVSCodeAuthentication(token, userData.access_token, isProduction, userId, orgId);
    await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId: token, context });
    vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
    showInformationMessage('User successfully authenticated with Razroo.');
    return userData;
  });
};

export const tryToAuth = async (context: vscode.ExtensionContext) => {
  const accessToken: string | undefined = await context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  const refreshToken: string | undefined = await context.workspaceState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  const userId = await context.workspaceState.get(MEMENTO_RAZROO_USER_ID) as string;
  const orgId = await context.workspaceState.get(MEMENTO_RAZROO_ORG_ID) as string;
  const token: string | undefined = await context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  if (accessToken && refreshToken && userId && orgId && token) {

    if(isTokenExpired(accessToken)) {
      await refreshAuth0Token(context, refreshToken, userId, orgId, token);
    }

    else {
      const isProduction = context.extensionMode === 1;
      await updatePrivateDirectoriesInVSCodeAuthentication(token!, context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN)!, isProduction, userId, orgId);
      await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId: token, context });
      vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
      showInformationMessage('User successfully authenticated with Razroo.');
    }
  } else {
    vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
  }
};
