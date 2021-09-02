import {
  AUTH0URL,
  MEMENTO_RAZROO_ID_TOKEN,
  MEMENTO_RAZROO_ID_VS_CODE_TOKEN,
} from './constants';
import * as request from 'request';
import * as vscode from 'vscode';
import gql from 'graphql-tag';
import client from './graphql/subscription';
import * as AdmZip from 'adm-zip';
import * as fs from 'fs';
import { URL_API_GATEGAY } from './graphql/awsConstants';

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
    var zip = new AdmZip(body);
    //Create new folder if not exist
    const folderName = `${context.extensionPath}/`;
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
    //Update the workspace with the new folder and the new files
    vscode.workspace.updateWorkspaceFolders(0, undefined, {
      uri: vscode.Uri.parse(`${folderName}`),
      name: '',
    });
    zip.extractAllTo(folderName, false);
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
          }
          console.log('idToken still valid.');
          i++;
        }
      }
    );
    await sleep(3000);
  }

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
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
