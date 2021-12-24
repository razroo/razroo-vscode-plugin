import gql from 'graphql-tag';
import { MEMENTO_RAZROO_ID_TOKEN, MEMENTO_RAZROO_USER_ID } from '../constants';
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../graphql/awsConstants';
import client from '../graphql/subscription';
import { saveFiles } from './utils';
import axios from 'axios';
import { readPackageJson } from '@razroo/razroo-angular-devkit';

export const subscribeToGenerateVsCodeDownloadCodeSub = ({
  vsCodeInstanceId,
  context,
}: any) => {

let isProduction = context.extensionMode === 1;
  //Subscribe with appsync client
  client(`${context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)}`, isProduction)
    .hydrated()
    .then(async function (client) {
      //Now subscribe to results
      const observable = client.subscribe({ query: gql(`
        subscription MySubscription {
            generateVsCodeDownloadCodeSub(vsCodeInstanceId: "${vsCodeInstanceId}") {
              vsCodeInstanceId
              downloadUrl
              parameters
              customInsertPath
            }
          }
        `)
      });

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

export async function getPackageJsonString(packageJsonFilePath: string) {
  const packageJson = await readPackageJson(packageJsonFilePath);

  return {
    name: packageJson ? packageJson.name : '',
  }.toString();
}

export const updatePrivateDirectoriesRequest = async ({
  vsCodeToken,
  idToken,
  privateDirectories,
  isProduction,
  userId
}: any) => {
  const packageJsonString = await getPackageJsonString("package.json");
  
  const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
  const body = {
    query: 'mutation updateVSCodeAuthentication ' +
      `{ updateVSCodeAuthentication(userId: "${userId}", vsCodeInstanceId: "${vsCodeToken}", privateDirectories: "${privateDirectories}", packageJsonParams: ${packageJsonString}) ` +
      '{ idToken refreshToken vsCodeInstances { privateDirectories vsCodeInstanceId }} }',
  };
  try {
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'charset=utf-8',
        Authorization: `${idToken}`,
      },
    });
    return response?.data;
  } catch (error) {
    console.log('error updatePrivateDirectoriesRequest', error);
    return error;
  }
};
