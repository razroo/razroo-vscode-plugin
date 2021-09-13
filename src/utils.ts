import {
  AUTH0URL,
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
  MEMENTO_RAZROO_ID_TOKEN,
  MEMENTO_RAZROO_ID_VS_CODE_TOKEN,
  MEMENTO_RAZROO_REFRESH_TOKEN,
} from './constants';
import * as request from 'request';
import * as vscode from 'vscode';
import gql from 'graphql-tag';
import client from './graphql/subscription';
import * as AdmZip from 'adm-zip';
import * as fs from 'fs';
import { URL_API_GATEGAY } from './graphql/awsConstants';
import { AuthenticationClient } from 'auth0';
import jwt_decode from 'jwt-decode';
import { readdir } from 'fs/promises';
import * as path from 'path';

const showErrorMessage = vscode.window.showErrorMessage;
const showInformationMessage = vscode.window.showInformationMessage;

async function* getFiles(dir: string) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
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

export const getAuth0Url = (token: string, socketHost: string) => {
  const host =
    process.env.scope === 'DEVELOPMENT' ? 'http://localhost:4200' : AUTH0URL;
  const loginUrl = `${host}?vscodeToken=${token}&socketVsCode=${socketHost}`;
  return loginUrl;
};

export const saveFiles = async (
  data: any,
  context: vscode.ExtensionContext
) => {
  const url = data.data.generateVsCodeDownloadCodeSub.downloadUrl;
  console.log('url', url);

  //Get files of S3
  request.get({ url, encoding: null }, async (err, res, body) => {
    const folderName = `${context.extensionPath}/razroo_files`;
    var zip = new AdmZip(body);
    zip.extractAllTo(folderName, false);
    const files: string[] = [];
    for await (const f of getFiles(folderName)) {
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
    fs.rmdirSync(folderName + '/templates', { recursive: true });
    //Update the workspace with the new folder and the new files
    vscode.workspace.updateWorkspaceFolders(0, undefined, {
      uri: vscode.Uri.parse(`${folderName}`),
      name: 'razroo_files',
    });
    showInformationMessage('Extracted files in the workspace.');
  });
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
    request.get(
      {
        url:
          URL_API_GATEGAY +
          `/authenticationVSCode/vsCodeInstanceId/${vsCodeInstanceId}`,
      },
      async (error, res, body) => {
        console.log('response', res);
        console.log('body', body);
        console.log('error', error);
        body = JSON.parse(body);
        const authenticationVSCode = body?.authenticationVSCode;
        //Check if the authenticationVSCode token not is empty and the idToken is new
        if (res?.statusCode === 200 && authenticationVSCode) {
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
      }
    );
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
    showErrorMessage('Id token expired.');
    errorRefreshToken = await refreshToken(
      `${context.workspaceState.get(MEMENTO_RAZROO_REFRESH_TOKEN)}`,
      errorRefreshToken
    );
  }

  if (!errorGetAuthentication && !errorRefreshToken) {
    //Query to subscribe in graphql
    const subquery = gql(`
  subscription MySubscription {
      generateVsCodeDownloadCodeSub(vsCodeInstanceId: "${vsCodeInstanceId}") {
        vsCodeInstanceId
        downloadUrl
        parameters
      }
    }
  `);

    //Subscribe with appsync client
    client(`${context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)}`)
      .hydrated()
      .then(async function (client) {
        //Now subscribe to results
        const observable = client.subscribe({ query: subquery });

        const realtimeResults = async function realtimeResults(data: any) {
          console.log('realtime data: ', data);
          //Save the files in a new folder
          await saveFiles(data, context);
        };

        observable.subscribe({
          next: realtimeResults,
          complete: console.log,
          error: console.log,
        });
      });
  } else {
    showErrorMessage('Connection error');
  }

  return { error: errorGetAuthentication };
};

async function refreshToken(refresh_token: string, errorRefreshToken: boolean) {
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
