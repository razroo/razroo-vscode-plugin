import {
  AUTH0URL,
  // AUTH0_CLIENT_ID,
  // AUTH0_DOMAIN,
  // MEMENTO_RAZROO_ID_TOKEN,
  // MEMENTO_RAZROO_ID_VS_CODE_TOKEN,
  // MEMENTO_RAZROO_REFRESH_TOKEN,
  // MEMENTO_RAZROO_USER_ID
} from '../constants.js';
import * as vscode from 'vscode';
const AdmZip = require('adm-zip');
import * as fs from 'fs';
// import { AuthenticationClient } from 'auth0';
import jwt_decode from 'jwt-decode';
import { readdir } from 'fs/promises';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { 
  updatePrivateDirectoriesRequest
} from './graphql.utils.js';
import {
  getFileS3,
} from './request.utils.js';
import { EditInput, morphCode } from '@razroo/razroo-devkit';

// const showErrorMessage = vscode.window.showErrorMessage;
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

export const getAuth0Url = (vsCodeToken: string, isProduction: boolean) => {
  const data = {
    vsCodeToken,
  };
  console.log('data', data);
  // Encode data with JWT to send to frontend in the URL
  const dataEncode = jwt.sign(data, 'razroo-vsCodeExtension');
  console.log('dataEncode', dataEncode);
  const host = isProduction === true ? AUTH0URL : 'http://localhost:4200';
  const loginUrl = `${host}?vsCodeData=${dataEncode}`;
  return loginUrl;
};

export const saveFiles = async (
  data: any,
  context: vscode.ExtensionContext
) => {
  const url = data.data.generateVsCodeDownloadCodeSub.downloadUrl;
  const type = data.data.generateVsCodeDownloadCodeSub.template.type;
  
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

  // Extract files from zip
  var zip = new AdmZip(files);

  try {
    zip.extractAllTo(path.join(folderName,'razroo_files_temp'), true);
  } catch (error) {
    console.log('error extractAllTo', error);
  }

  // Remove levels of folders of the zip file
  const tempFiles: string[] = [];
  for await (const f of getFiles(path.join(folderName,'razroo_files_temp'))) {
    tempFiles.push(f);
  }
  tempFiles.forEach(async(file: any) => {
    if(type === 'edit' && path.extname(file) === ".json") {
      // for now getting the first item in the array for testing purposes
      const editJson = JSON.parse(fs.readFileSync(file).toString());


      editJson.updates.forEach((editInput: EditInput) => {
        const newFile = path.join(folderName, path.basename(file));
        const fileToBeAddedToPath = newFile.replace(/\.[^.]+$/, `.${editInput.fileType}`);
        const fileToBeAddedTo = fs.readFileSync(fileToBeAddedToPath, 'utf-8').toString();
        
        // the fileToBeAddedTo needs to be manually added in.
        const updatedEditInput = {...editInput, fileToBeAddedTo};
        
        const convertedCode = morphCode(updatedEditInput);
  
        fs.writeFile(fileToBeAddedToPath, convertedCode, async(_) => {
          console.log(`${fileToBeAddedToPath} has been edited`);
        });
      });
      
      showInformationMessage('Files have been edited. Lets goooo!!!');
    }

    if(path.extname(file) === ".sh") {
      const commandToExecute = fs.readFileSync(file).toString();

      const terminal = vscode.window.createTerminal(`Razroo Terminal`);
      terminal.show();
      terminal.sendText(commandToExecute);
    }

    if(type !== 'edit' && path.extname(file) !== ".sh") {
      fs.copyFile(file, path.join(folderName, path.basename(file)), (err) => {
        if (!err) {
          console.log(file + ' has been copied!');
        } else {
          console.log('error file', err);
        }
      });
    }
  });
  //If the folder is not the default folder then it is deleted, otherwise it is not
  if (folderName !== path.join(folderName,'razroo_files_temp')) {
    fs.rmdirSync(path.join(folderName,'razroo_files_temp'), { recursive: true });
  } else {
    fs.rmdirSync(path.join(folderName,'razroo_files_temp', 'newPath'), {
      recursive: true,
    });
    vscode.workspace.updateWorkspaceFolders(0, undefined, {
      uri: vscode.Uri.parse(`${folderName}`),
      name: 'razroo_files',
    });
  }
  showInformationMessage('Extracted files in the workspace.');
};

// async function getNewRefreshToken(refresh_token: string) {
//   let errorRefreshToken = false;
//   const auth0 = new AuthenticationClient({
//     domain: AUTH0_DOMAIN,
//     clientId: AUTH0_CLIENT_ID,
//   });

//   vscode.window.withProgress(
//     {
//       location: vscode.ProgressLocation.Window,
//       cancellable: false,
//       title: 'Authentication in Razroo',
//     },
//     async (progress) => {
//       progress.report({ increment: 0 });

//       try {
//         const responseRefreshToken = await auth0.refreshToken({
//           refresh_token,
//         });
//         console.log('responseRefreshToken', responseRefreshToken);
//         //TODO update the vscode-authentication table with the id_token and the refresh_token new
//         //Do we still have to do this? Try testing with old token.
//         showInformationMessage('Refresh token successful.');
//       } catch (error) {
//         console.log('Error refreshToken');
//         errorRefreshToken = true;
//       }

//       progress.report({ increment: 100 });
//     }
//   );

//   return errorRefreshToken;
// }

export function isExpiredToken(idToken: string) {
  var decodedToken: any = jwt_decode(idToken);
  const tokenExpiredDate = decodedToken?.exp;
  const dateNowInSecondsEpoch = Math.round(new Date().getTime() / 1000);
  return dateNowInSecondsEpoch >= tokenExpiredDate;
}

const flatten = (lists: any) => {
  return lists.reduce((a, b) => a.concat(b), []);
};

const getDirectories = (srcpath: string) => {
  return fs
    .readdirSync(srcpath)
    .map((file) => path.join(srcpath, file))
    .filter((path) => fs.statSync(path).isDirectory() && !path.includes('.git'));
};

const getDirectoriesRecursive = (srcpath: string) => {
  return [
    srcpath,
    ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive)),
  ];
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
  if(process.platform === "win32"){
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
  if(fullPath.length < 1){
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
  // obtain full path of the folders of the workspace
  const workspaceFolders = getWorkspaceFolders();
  // remove full path and obtain the private path for each folder
  let privateDirectories: Array<string> = [];

  const excludeFolders = readGitIgnoreFile();
  workspaceFolders?.map((folder) => {
    const directories = getDirectoriesWithoutPrivatePath(
      folder.path,
      folder.name
    ).map(file => file.replace(/\\/g, "/"));
    //Remove folders by .gitignore file and push in private directories array
    privateDirectories.push(
      directories?.filter(
        (dir: string) => !existFolderInGitIgnoreFile(excludeFolders, dir)
      )
    );
  });
  console.log("PRIV DIRECTORIES", privateDirectories)
  //update vscode-authentication table with the privateDirectories
  return updatePrivateDirectoriesRequest({
    vsCodeToken,
    idToken,
    privateDirectories,
    isProduction,
    userId
  });
};
    
const getWorkspaceFolders = () => {
  console.log("VSCODE WORKSPACE FOLDERS: ", vscode.workspace?.workspaceFolders);
  return vscode.workspace?.workspaceFolders?.map((folder) => {
    return { name: folder.name, path: folder?.uri?.fsPath };
  });
};

const readGitIgnoreFile = () => {
  var excludeFolders: Array<string> = [];
  try {
    excludeFolders = fs
      .readFileSync(path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath as any, '.gitignore'))
      .toString()
      .split('\n')
      .filter((str) => str.length);
    console.log('excludeFolders', excludeFolders);
  } catch (error) {
    console.log('Error open excludeFolders file', error);
    excludeFolders = [];
  }
  return excludeFolders;
};

const existFolderInGitIgnoreFile = (
  excludeFolders: Array<string>,
  privateDirectory: string
) => {
  //Check that exist a folder that match with a folder of the .gitignore
  return excludeFolders.some((dir) => privateDirectory.includes(dir));
};
