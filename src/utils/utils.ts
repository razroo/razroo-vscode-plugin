import {
  AUTH0URL,
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
  MEMENTO_RAZROO_ID_TOKEN,
  MEMENTO_RAZROO_ID_VS_CODE_TOKEN,
  MEMENTO_RAZROO_REFRESH_TOKEN,
} from '../constants';
import * as vscode from 'vscode';
import * as AdmZip from 'adm-zip';
import * as fs from 'fs';
import { AuthenticationClient } from 'auth0';
import jwt_decode from 'jwt-decode';
import { readdir } from 'fs/promises';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { subscribeToGenerateVsCodeDownloadCodeSub } from './graphql.utils';
import {
  getFileS3,
  getVSCodeAuthentication,
  updatePrivateDirectoriesRequest,
} from './request.utils';

const showErrorMessage = vscode.window.showErrorMessage;
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

export const getAuth0Url = (vsCodeToken: string) => {
  const data = {
    vsCodeToken,
  };
  console.log('data', data);
  // Encode data with JWT to send to frontend in the URL
  const dataEncode = jwt.sign(data, 'razroo-vsCodeExtension');
  console.log('dataEncode', dataEncode);
  const host =
    process.env.scope === 'DEVELOPMENT' ? 'http://localhost:4200' : AUTH0URL;
  const loginUrl = `${host}?vsCodeData=${dataEncode}`;
  return loginUrl;
};

export const saveFiles = async (
  data: any,
  context: vscode.ExtensionContext
) => {
  const url = data.data.generateVsCodeDownloadCodeSub.downloadUrl;
  console.log('url', url);

  //Get files of S3
  const file = await getFileS3({ url });
  console.log('file', file);

  const userFolderSelected =
    data?.data?.generateVsCodeDownloadCodeSub?.customInsertPath;
  // Set in folderName the default path or the selected path of the user to insert the download files
  let folderName = `${context.extensionPath}/razroo_files`;
  if (userFolderSelected?.length) {
    const folderSelectedInWorkspace =
      findFolderUserSelectedInWorkspace(userFolderSelected);
    folderName = `${folderSelectedInWorkspace}`;
  }
  // Extract files from zip
  var zip = new AdmZip(file);
  try {
    zip.extractAllTo(folderName, false);
  } catch (error) {
    console.log('error extractAllTo', error);
    zip.extractAllTo(`${context.extensionPath}/razroo_files`, false);
    folderName = `${context.extensionPath}/razroo_files`;
  }
  // Remove levels of folders of the zip file
  const files: string[] = [];
  for await (const f of getFiles(folderName + '/{newPath}')) {
    files.push(f);
  }
  files.forEach((file) => {
    fs.copyFile(file, folderName + '/' + path.basename(file), (err) => {
      console.log('error file', err);
      if (!err) {
        console.log(file + ' has been copied!');
      }
    });
  });
  fs.rmdirSync(folderName + '/{newPath}', { recursive: true });
  //Update the workspace with the new folder and the new files
  vscode.workspace.updateWorkspaceFolders(0, undefined, {
    uri: vscode.Uri.parse(`${folderName}`),
    name: 'razroo_files',
  });
  showInformationMessage('Extracted files in the workspace.');
};

export const existVSCodeAuthenticate = async (
  context: vscode.ExtensionContext
) => {
  console.log('Start');

  const vsCodeInstanceId = context.workspaceState.get(
    MEMENTO_RAZROO_ID_VS_CODE_TOKEN
  );
  const idToken = context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN);

  // Loop to obtain the idToken to subscribes in grapqh
  let cont = 0;
  let errorGetAuthentication = false;
  for (let i = 0; i < 1; ) {
    const { authenticationVSCode, status } = await getVSCodeAuthentication({
      vsCodeInstanceId,
    });
    // Check if the authenticationVSCode token not is empty and the idToken is new
    if (status === 200 && authenticationVSCode) {
      if (authenticationVSCode.idToken !== idToken) {
        console.log('Correct token');
        context.workspaceState.update(
          MEMENTO_RAZROO_ID_TOKEN,
          authenticationVSCode.idToken
        );
        context.workspaceState.update(
          MEMENTO_RAZROO_REFRESH_TOKEN,
          authenticationVSCode.refreshToken
        );
      }
      console.log('idToken still valid.');
      i++;
    }

    await sleep(2000);
    cont++;
    //After one minute. Finish
    if (cont === 30) {
      i++;
      cont = 0;
      errorGetAuthentication = true;
    }
  }

  let errorRefreshToken = false;
  if (
    isExpiredToken(`${context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)}`)
  ) {
    showErrorMessage('idToken expired.');
    errorRefreshToken = await getNewRefreshToken(
      `${context.workspaceState.get(MEMENTO_RAZROO_REFRESH_TOKEN)}`
    );
  }

  if (!errorGetAuthentication && !errorRefreshToken) {
    await updatePrivateDirectoriesInVSCodeAuthentication(
      `${vsCodeInstanceId}`,
      `${context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)}`
    );

    subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId, context });
  } else {
    showErrorMessage('Connection error');
  }

  return { error: errorGetAuthentication };
};

async function getNewRefreshToken(refresh_token: string) {
  let errorRefreshToken = false;
  const auth0 = new AuthenticationClient({
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
  });

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      cancellable: false,
      title: 'Authentication in Razroo',
    },
    async (progress) => {
      progress.report({ increment: 0 });

      try {
        const responseRefreshToken = await auth0.refreshToken({
          refresh_token,
        });
        console.log('responseRefreshToken', responseRefreshToken);
        //TODO update the vscode-authentication table with the id_token and the refresh_token new
        showInformationMessage('Refresh token successful.');
      } catch (error) {
        console.log('Error refreshToken');
        errorRefreshToken = true;
      }

      progress.report({ increment: 100 });
    }
  );

  return errorRefreshToken;
}

function isExpiredToken(idToken: string) {
  var decodedToken: any = jwt_decode(idToken);
  const tokenExpiredDate = decodedToken?.exp;
  const dateNowInSecondsEpoch = Math.round(new Date().getTime() / 1000);
  return dateNowInSecondsEpoch >= tokenExpiredDate;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const flatten = (lists: any) => {
  return lists.reduce((a, b) => a.concat(b), []);
};

const getDirectories = (srcpath: string) => {
  return fs
    .readdirSync(srcpath)
    .map((file) => path.join(srcpath, file))
    .filter((path) => fs.statSync(path).isDirectory());
};

const getDirectoriesRecursive = (srcpath: string) => {
  if(!srcpath.includes('.git') && !srcpath.includes('node_modules')){
    return [
      srcpath,
      ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive)),
    ];
  }
};

export const getDirectoriesWithoutPrivatePath = (
  path: string,
  pathName: string
) => {
  return getDirectoriesRecursive(path)?.map((folder) => {
    return folder.slice(folder.search(pathName), folder.length);
  });
};

const findFolderUserSelectedInWorkspace = (folderSelected: string) => {
  //Obtain the current folders of the workspace
  const workspaceFolders = getWorkspaceFolders();
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
  return fullPath;
};

const updatePrivateDirectoriesInVSCodeAuthentication = async (
  vsCodeToken: string,
  idToken: string
) => {
  // obtain full path of the folders of the workspace
  const workspaceFolders = getWorkspaceFolders();
  // remove full path and obtain the private path for each folder
  let privateDirectories: Array<string> = [];
  workspaceFolders?.map((folder) => {
    privateDirectories.push(
      getDirectoriesWithoutPrivatePath(folder.path, folder.name)
    );
  });
  //update vscode-authentication table with the privateDirectories
  await updatePrivateDirectoriesRequest({
    vsCodeToken,
    idToken,
    privateDirectories,
  });
};
const getWorkspaceFolders = () => {
  return vscode.workspace?.workspaceFolders?.map((folder) => {
    return { name: folder.name, path: folder?.uri?.path };
  });
};
