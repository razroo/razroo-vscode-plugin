import {
  RAZROO_DEV_URL,
  RAZROO_URL,
  COMMAND_AUTH0_AUTH,
  MEMENTO_RAZROO_ACCESS_TOKEN
} from '../constants';
import * as vscode from 'vscode';
const AdmZip = require('adm-zip');
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import {
  removeVsCodeInstanceMutation,
  subscribeToGenerateVsCodeDownloadCodeSub,
  updatePrivateDirectoriesRequest,
  auth0Client
} from './graphql.utils';
import {
  getFileS3,
} from './request.utils';
import { MEMENTO_RAZROO_ID_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_REFRESH_TOKEN, MEMENTO_RAZROO_USER_ID } from '../constants';
// import parseGitignore from 'parse-gitignore';
import process from 'process';
import { editFiles } from './edit.utils';
import { filterIgnoredDirs, getWorkspaceFolders } from './directory.utils';
import { isTokenExpired } from './date.utils';
import { integrationTestGeneratedFiles, unitTestGeneratedFiles } from './test.utils';
import { join } from 'path';
import { determineType, effects, getVersionAndNameString, replaceCurlyBrace } from '@razroo/razroo-codemod';

const showInformationMessage = vscode.window.showInformationMessage;

export const validateEmail = (email: string) => {
  const res =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return res.test(String(email).toLowerCase()) ? undefined : email;
};

export const getAuth0Url = (isProduction: boolean) => {
  const host = isProduction === true ? RAZROO_URL : RAZROO_DEV_URL;
  return `${host}/vscode-auth`;
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
    const fileNameandPath = replaceCurlyBrace(parametersParsed, zipEntry.entryName);
    const fileName = replaceCurlyBrace(parametersParsed, zipEntry.name);

    if (path.extname(fileName) === ".sh") {
      const commandToExecute = zipEntry.getData().toString("utf8");
      const execution = new vscode.ShellExecution(commandToExecute);
      const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
      vscode.tasks.executeTask(task);
      showInformationMessage('Command run in terminal');
    }

    if (type !== 'edit' && path.extname(fileName) !== ".sh") {
      try {
        const fileData = zipEntry.getData().toString("utf8");
        const fullPathOfFile = path.join(folderRoot, fileNameandPath);
        fse.outputFile(fullPathOfFile, fileData);
        const programmingLanguageName = getVersionAndNameString(template.pathId).name;
        const programmingLanguage = template.baseCommunityPath ? template.baseCommunityPath : programmingLanguageName; 
        const genCodeType = determineType(zipEntry.entryName, templateParameters);
        effects(fullPathOfFile, genCodeType, programmingLanguage, parameters);
        showInformationMessage('Files generated');
      } catch (error) {
        console.log('extractEntryTo', error);
      }
    }

    if(data.data.generateVsCodeDownloadCodeSub.runUnitTests) {
      let template = data.data.generateVsCodeDownloadCodeSub.template;
      await unitTestGeneratedFiles(fileNameandPath, folderRoot, template, context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)!, context.extensionMode === 1);
    }
  
    if(data.data.generateVsCodeDownloadCodeSub.runIntegrationTests) {
      let template = data.data.generateVsCodeDownloadCodeSub.template;
      integrationTestGeneratedFiles(fileNameandPath, folderRoot, template, context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)!, context.extensionMode === 1);
    }
  }
  
};

const flatten = (lists: any) => {
  return lists.reduce((a, b) => a.concat(b), []);
};

const getDirectories = (srcpath: string) => {
  return fs
    .readdirSync(srcpath)
    .map((file) => path.join(srcpath, file))
    .filter((path) => fs.statSync(path).isDirectory() && !path.includes('.git') && !path.includes('node_modules'));
};

const getDirectoriesRecursive = (srcpath: string) => {
  return [
    srcpath,
    ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive)),
  ];
};

export const getDirectoriesWithoutPrivatePath = (item: any) => {
  const { path, name } = item;
  return getDirectoriesRecursive(path)?.map((folder) => {
    return folder.slice(folder.search(name), folder.length);
  });
};

const findFolderUserSelectedInWorkspace = (folderSelected: string) => {
  if (process.platform === "win32") {
    //If windows, correct path for windows file system
    folderSelected = folderSelected.replace(/\//g, "\\");
  }
  console.log("NEW FOLDER SELECTED: ", folderSelected);
  //Obtain the current folders of the workspace
  const workspaceFolders = getWorkspaceFolders();
  console.log("WORKSPACE FOLDERS: ", workspaceFolders);
  const workspaceFoldersLength = workspaceFolders
    ? workspaceFolders?.length
    : 0;
  // Define variable to save the folder that match with the folderUserSelected
  let fullPath: string = '';
  // loop in current folders of the workspace
  for (let i = 0; i <= workspaceFoldersLength; i++) {
    const folder = workspaceFolders?.[i];
    if (!folder) {
      break;
    }
    // obtains the subfolders of the current folder
    const directoriesInThisFolder = getDirectoriesRecursive(folder?.path);
    console.log("DIRECTORIES IN FOLDER: ", directoriesInThisFolder);
    for (let j = 0; j <= directoriesInThisFolder?.length; j++) {
      const folderPath = directoriesInThisFolder[j];
      if (folderPath) {
        const privatePath = folderPath?.slice(
          folderPath.search(folder.name),
          folderPath.length
        );
        // If the folder is found break the second loop
        if (privatePath === folderSelected) {
          fullPath = folderPath;
          break;
        }
      }
    }
    // If the folder is found break the first loop
    if (fullPath.length) {
      break;
    }
  }
  if (fullPath.length < 1) {
    // if after loop the selected path was not found in current directories, then create new folders for the files:
    let newFolderPath = path.join((workspaceFolders?.[0].path as string), folderSelected.replace((workspaceFolders?.[0].name as string), ''))
    fs.mkdirSync(newFolderPath, { recursive: true })
    fullPath = newFolderPath;
  }
  return fullPath;
};

export const updatePrivateDirectoriesInVSCodeAuthentication = async (
  vsCodeToken: string,
  idToken: string,
  isProduction: boolean,
  userId: string
) => {
  const privateDirectories = await getPrivateDirs();

  console.log("PRIV DIRECTORIES", privateDirectories);

  return updatePrivateDirectoriesRequest({
    vsCodeToken,
    idToken,
    privateDirectories,
    isProduction,
    userId
  });
};

const getPrivateDirs = async () => {
  let dirs = getWorkspaceFolders()?.map(getDirectoriesWithoutPrivatePath)?.flat() || [];
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
  const idToken: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN);
  const refreshToken: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  if (vsCodeInstanceId && userId && idToken && refreshToken) {
    console.log('this is called as inside inside inside');
    return removeVsCodeInstanceMutation(idToken, userId, vsCodeInstanceId, isProduction)
      .catch((error: any) => console.log('Remove VSCode Instance Error: ', error))
      .finally(() => {
        context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, null);
        context.workspaceState.update(MEMENTO_RAZROO_USER_ID, null);
        context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, null);
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

async function refreshAuth0Token(context, refreshToken, userId, token) {
  let isProduction = context.extensionMode === 1;

  return auth0Client(isProduction).refreshToken({ refresh_token: refreshToken }, async function (err, userData) {
    if (err) {
      console.log("err: ", err);
      return err;
    }

    await context.workspaceState.update(MEMENTO_RAZROO_ACCESS_TOKEN, userData.access_token);
    await context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, userData.refresh_token);
    await context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, userData.id_token);
    const isProduction = context.extensionMode === 1;
    await updatePrivateDirectoriesInVSCodeAuthentication(token, userData.access_token, isProduction, userId);
    await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId: token, context });
    vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
    showInformationMessage('User successfully authenticated with Razroo.');
    return userData;
  });
};

export const tryToAuth = async (context: vscode.ExtensionContext) => {
  let idToken: string | undefined = await context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN);
  const refreshToken: string | undefined = await context.workspaceState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  const userId = await context.workspaceState.get(MEMENTO_RAZROO_USER_ID) as string;
  const token: string | undefined = await context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  if (idToken && refreshToken && userId && token) {

    if(isTokenExpired(idToken)) {
      await refreshAuth0Token(context, refreshToken, userId, token);
    }

    else {
      const isProduction = context.extensionMode === 1;
      await updatePrivateDirectoriesInVSCodeAuthentication(token!, context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)!, isProduction, userId);
      await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId: token, context });
      vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
      showInformationMessage('User successfully authenticated with Razroo.');
    }
  } else {
    vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
  }
};
