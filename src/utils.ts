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
  const url = data.data.generateCodeDownloadSub.downloadUrl;
  console.log('url', url);
  request.get({ url, encoding: null }, async (err, res, body) => {
    var zip = new AdmZip(body);

    const folderName = `${context.extensionPath}/razroo_files`;

    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
    vscode.workspace.updateWorkspaceFolders(0, undefined, {
      uri: vscode.Uri.parse(`${folderName}`),
      name: 'razroo_files',
    });

    zip.extractAllTo(folderName, false);
  });
};

export const existVSCodeAuthenticate = async (
  context: vscode.ExtensionContext
) => {
  console.log('Start');

  const vsCodeToken = context.workspaceState.get(
    MEMENTO_RAZROO_ID_VS_CODE_TOKEN
  );
  const idToken = context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN);
  const url = 'https://e6gvzer89l.execute-api.us-east-1.amazonaws.com/Stage';
  for (let i = 0; i < 1; ) {
    request.get(
      {
        url: url + `/authenticationVSCode/vsCodeToken/${vsCodeToken}`,
      },
      async (error, res, body) => {
        console.log('response', res);
        console.log('body', body);
        console.log('error', error);
        body = JSON.parse(body);
        console.log(
          'authentication vscode',
          body?.authenticationVSCode?.vsCodeToken
        );
        console.log(
          'authentication vscode if',
          body?.authenticationVSCode?.vsCodeToken === vsCodeToken
        );
        if (body?.statusCode === 200 && body?.authenticationVSCode) {
          if (body?.authenticationVSCode?.idToken !== idToken) {
            console.log('Correct token');
            context.workspaceState.update(
              MEMENTO_RAZROO_ID_TOKEN,
              body?.authenticationVSCode?.idToken
            );
            eval(`response = ${body?.authenticationVSCode?.vsCodeToken}`);

            //Emit event of resubscribe
          }
          console.log('idToken still valid.');
          i++;
        }
      }
    );
    // response = await axios.get(`url/authenticationVSCode/vsCodeToken/${token}`);
    // if (
    //   response?.data?.authenticationVSCode &&
    //   Object.keys(response?.data?.authenticationVSCode).length
    // ) {
    //   i++;
    // }
    await sleep(3000);
  }

  const subquery = gql(`
  subscription MySubscription {
      generateCodeDownloadSub(vsCodeToken: "${vsCodeToken}") {
        vsCodeToken
        downloadUrl
        parameters
      }
    }
  `);

  client(`${context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)}`)
    .hydrated()
    .then(async function (client) {
      //Now subscribe to results
      const observable = client.subscribe({ query: subquery });

      const realtimeResults = async function realtimeResults(data: any) {
        console.log('realtime data: ', data);
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
