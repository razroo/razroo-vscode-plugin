import gql from 'graphql-tag';
import { MEMENTO_RAZROO_ID_TOKEN, MEMENTO_RAZROO_USER_ID } from '../constants';
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../graphql/awsConstants';
import client from '../graphql/subscription';
import { saveFiles } from './utils';
import axios from 'axios';
import { determineLanguagesUsed, getProjectDependencies, readPackageJson } from '@razroo/razroo-devkit';
import * as vscode from 'vscode';
import * as path from 'path';

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
              template {
                id
                type
              }
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

export async function getPackageJson(workspacePath: string) {
  const packageJsonFilePath = path.join(workspacePath, 'package.json');
  const packageJson = await readPackageJson(packageJsonFilePath);
  const projectDependenciesMap = await getProjectDependencies(vscode.workspace.workspaceFolders?.[0].uri.fsPath as any);
  const transformedProjectDependencies = await determineLanguagesUsed(projectDependenciesMap);

  const newlyTransformedJson = {
    name: packageJson ? packageJson.name : '',
    languages: transformedProjectDependencies
  };
  return JSON.stringify(newlyTransformedJson);
}

export const updatePrivateDirectoriesRequest = async ({
  vsCodeToken,
  idToken,
  privateDirectories,
  isProduction,
  userId
}: any) => {
  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  const packageJsonParams = await getPackageJson(workspacePath as any);

  const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
  const body = {
    query: `mutation updateVSCodeAuthentication($userId: String!, $vsCodeInstanceId: String!, $idToken: String!, 
      $privateDirectories: String, $packageJsonParams: AWSJSON ) {
        updateVSCodeAuthentication(userId: $userId, vsCodeInstanceId: $vsCodeInstanceId, idToken: $idToken, 
          privateDirectories: $privateDirectories, packageJsonParams: $packageJsonParams) {
          idToken
          refreshToken
          vsCodeInstances {
            privateDirectories
            vsCodeInstanceId
            packageJsonParams {
              name
              languages
            }
          }
        }
      }`,
    variables: {
      userId: userId,
      vsCodeInstanceId: vsCodeToken,
      idToken: idToken,
      privateDirectories: `${privateDirectories}`,
      packageJsonParams: packageJsonParams,
    }  
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
