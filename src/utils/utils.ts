import {
  AUTH0URL,
  COMMAND_AUTH0_AUTH,
  MEMENTO_RAZROO_ACCESS_TOKEN
} from '../constants.js';
import * as vscode from 'vscode';
const AdmZip = require('adm-zip');
import * as fs from 'fs';
import { readdir } from 'fs/promises';
import * as path from 'path';
import {
  removeVsCodeInstanceMutation,
  subscribeToGenerateVsCodeDownloadCodeSub,
  updatePrivateDirectoriesRequest,
  auth0Client
} from './graphql.utils.js';
import {
  getFileS3,
} from './request.utils.js';
import { MEMENTO_RAZROO_ID_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_REFRESH_TOKEN, MEMENTO_RAZROO_USER_ID } from '../constants.js';
// import parseGitignore from 'parse-gitignore';
import process from 'process';
import { editFiles } from './edit.utils.js';
import { filterIgnoredDirs, getWorkspaceFolders } from './directory.utils.js';
import jwt_decode from "jwt-decode";

const showInformationMessage = vscode.window.showInformationMessage;

async function* getFiles(dir: string) {
  const directories = await readdir(dir, { withFileTypes: true });
  for (const directory of directories) {
    const res = path.resolve(dir, directory.name);
    if (directory.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

export const validateEmail = (email: string) => {
  const res =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return res.test(String(email).toLowerCase()) ? undefined : email;
};

export const getAuth0Url = (isProduction: boolean) => {
  const host = isProduction === true ? AUTH0URL : 'http://localhost:4200';
  return `${host}/vscode-auth`;
};

export const saveFiles = async (
  data: any,
  context: vscode.ExtensionContext
) => {
  const url = data.data.generateVsCodeDownloadCodeSub.downloadUrl;
  // parameters will always be a string <-- architected specifically this way
  const parameters = data.data.generateVsCodeDownloadCodeSub?.parameters;
  const type = data.data.generateVsCodeDownloadCodeSub.template.type;
  const updates = data.data.generateVsCodeDownloadCodeSub?.template?.updates;

  //Get files of S3
  const files = await getFileS3({ url });
  const userFolderSelected =
    data?.data?.generateVsCodeDownloadCodeSub?.customInsertPath;
  console.log("USER FOLDER SELECTED: ", userFolderSelected);
  // Set in folderName the default path or the selected path of the user to insert the download files
  let folderName = path.join(context.extensionPath, 'razroo_files_temp');

  if (userFolderSelected?.length) {
    const folderSelectedInWorkspace =
      findFolderUserSelectedInWorkspace(userFolderSelected);
    folderName = `${folderSelectedInWorkspace}`;
    console.log("FOLDER NAME: ", folderName);
  }

  //#### TODO REFACTORING MAKE EDIT it's own thing right now inside code generation
  if (type === 'Edit' && updates) {
    editFiles(updates, parameters);

    return;
  }

  // Extract files from zip
  var zip = new AdmZip(files);

  try {
    zip.extractAllTo(path.join(folderName, 'razroo_files_temp'), true);
  } catch (error) {
    console.log('error extractAllTo', error);
  }

  // Remove levels of folders of the zip file
  const tempFiles: string[] = [];
  for await (const f of getFiles(path.join(folderName, 'razroo_files_temp'))) {
    tempFiles.push(f);
  }
  await Promise.all(tempFiles.map(async (file: any) => {

    if (path.extname(file) === ".sh") {
      const commandToExecute = fs.readFileSync(file).toString();

      const execution = new vscode.ShellExecution(commandToExecute);
      const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
      vscode.tasks.executeTask(task);
    }

    if (type !== 'edit' && path.extname(file) !== ".sh") {
      await fs.promises.copyFile(file, path.join(folderName, path.basename(file)))
        .then(() => console.log(file + ' has been copied!'))
        .catch(err => console.log('error file', err));
    }
  }));
  //If the folder is not the default folder then it is deleted, otherwise it is not
  if (folderName !== path.join(folderName, 'razroo_files_temp')) {
    fs.rmdirSync(path.join(folderName, 'razroo_files_temp'), { recursive: true });
  } else {
    fs.rmdirSync(path.join(folderName, 'razroo_files_temp', 'newPath'), {
      recursive: true,
    });
    vscode.workspace.updateWorkspaceFolders(0, undefined, {
      uri: vscode.Uri.parse(`${folderName}`),
      name: 'razroo_files',
    });
  }
  showInformationMessage('Extracted files in the workspace.');
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

export const onVSCodeClose = (context: vscode.ExtensionContext) => {
  const isProduction = context.extensionMode === 1;
  const vsCodeInstanceId: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  const userId: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_USER_ID);
  const idToken: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN);
  const refreshToken: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  if (vsCodeInstanceId && userId && idToken && refreshToken) {
    return removeVsCodeInstanceMutation(idToken, userId, vsCodeInstanceId, isProduction)
      .catch((error: any) => console.log('Remove VSCode Instance Error: ', error))
      .finally(() => {
        context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, null);
        context.workspaceState.update(MEMENTO_RAZROO_USER_ID, null);
        context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, null);
        context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, null);
      });
  } else {
    return;
  }
};
const refreshAuth0Token = async (context, refreshToken) => {
  return await auth0Client.refreshToken({ refresh_token: refreshToken }, function (err, userData) {
    if (err) {
      console.log("err: ", err);
    }
    context.workspaceState.update(MEMENTO_RAZROO_ACCESS_TOKEN, userData.access_token);
    context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, userData.refresh_token);
    console.log("old id token: ", context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN));
    context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, userData.id_token);
    console.log("new id token: ", context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN));
  });
};

export const tryToAuth = async (context: vscode.ExtensionContext) => {
  let idToken: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN);
  const refreshToken: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
  const userId = context.workspaceState.get(MEMENTO_RAZROO_USER_ID) as string;
  const token: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  if (idToken && refreshToken && userId && token) {
    let decodedIdToken: any = jwt_decode(idToken);
    if (((decodedIdToken.exp as number) * 1000) - Date.now() <= 0) {
      await refreshAuth0Token(context, refreshToken);
    }
    const isProduction = context.extensionMode === 1;
    console.log("after new id token");
    await updatePrivateDirectoriesInVSCodeAuthentication(token!, context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)!, isProduction, userId);
    await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId: token, context });
    vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
    showInformationMessage('User successfully authenticated with Razroo.');
  } else {
    vscode.commands.executeCommand(COMMAND_AUTH0_AUTH)
  }
};
