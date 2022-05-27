import { AUTH0_URL, DEV_AUTH0_URL, AUTH0_DEV_CLIENT_ID, AUTH0_CLIENT_ID } from './../constants';
import gql from 'graphql-tag';
import parseGitConfig from 'parse-git-config';
import getBranch from 'git-branch';
import { MEMENTO_RAZROO_ID_TOKEN } from '../constants.js';
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../graphql/awsConstants.js';
import client from '../graphql/subscription.js';
import { saveFiles, tryToAuth } from './utils.js';
import axios from 'axios';
import { determineLanguagesUsed, getProjectDependencies, readPackageJson } from '@razroo/razroo-devkit';
import * as vscode from 'vscode';
import * as path from 'path';
import { readNxJson } from './nx.utils.js';
import { AuthenticationClient } from 'auth0';
import { isTokenExpired } from './date.utils.js';

export const subscribeToGenerateVsCodeDownloadCodeSub = async ({
  vsCodeInstanceId,
  context,
}: any) => {
  let isProduction = context.extensionMode === 1;
  //Subscribe with appsync client
  client(`${context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)}`, isProduction)
    .hydrated()
    .then(async function (client) {
      //Now subscribe to results
      const generateVsCodeDownloadCodeSub$ = client.subscribe({
        query: gql(`
        subscription MySubscription {
            generateVsCodeDownloadCodeSub(vsCodeInstanceId: "${vsCodeInstanceId}") {
              vsCodeInstanceId
              downloadUrl
              parameters
              customInsertPath
              template {
                id
                type
                updates
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

      const error = async function error(data: any) {
        console.log('realtime data: ', data);
        //Save the files in a new folder
        generateVsCodeDownloadCodeSubError(data, context);
      };

      generateVsCodeDownloadCodeSub$.subscribe({
        next: realtimeResults,
        complete: console.log,
        error: error,
      });
    });
};

function generateVsCodeDownloadCodeSubError(data: any, context) {
  console.log('generateVsCodeDownloadCodeSubError:', data);
  let idToken = context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN);
  
  if(isTokenExpired(idToken as string)) {
    vscode.window.showInformationMessage(
      'Authentication Token Expired. Re-logging you in now.'
    );

    tryToAuth(context);
  }
}

export async function getVersionControlParams(workspacePath: string) {
  const gitOrigin = await parseGitConfig({ cwd: workspacePath, path: '.git/config' }).then(gitConfig => gitConfig?.['remote "origin"'].url);
  const gitBranch = await getBranch(workspacePath);

  return {
    gitOrigin,
    gitBranch,
  };
}

export async function getPackageJson(workspacePath: string) {
  const packageJsonFilePath = path.join(workspacePath, 'package.json');
  const packageJson = await readPackageJson(packageJsonFilePath);
  const projectDependenciesMap = await getProjectDependencies(vscode.workspace.workspaceFolders?.[0].uri.fsPath as any);
  const transformedProjectDependencies = await determineLanguagesUsed(projectDependenciesMap);
  const nx = await readNxJson(workspacePath);

  const newlyTransformedJson = {
    name: packageJson ? packageJson.name : '',
    languages: transformedProjectDependencies,
    nx: nx
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
  const versionControlsParams = await getVersionControlParams(workspacePath as string);

  const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
  const body = {
    query: `mutation updateVSCodeAuthentication($userId: String!, $vsCodeInstanceId: String!, $privateDirectories: String, $packageJsonParams: AWSJSON, $versionControlsParams: VersionControlsParamsInput) {
        updateVSCodeAuthentication(userId: $userId, vsCodeInstanceId: $vsCodeInstanceId, privateDirectories: $privateDirectories, packageJsonParams: $packageJsonParams, versionControlsParams: $versionControlsParams) {
          privateDirectories
          vsCodeInstanceId
          packageJsonParams {
            name
            languages
            nx {
              defaultProject
            }
          }
          versionControlsParams {
            gitOrigin
            gitBranch
          }
        }
      }`,
    variables: {
      userId: userId,
      vsCodeInstanceId: vsCodeToken,
      privateDirectories: `${privateDirectories}`,
      packageJsonParams: packageJsonParams,
      versionControlsParams: versionControlsParams,
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

export const removeVsCodeInstanceMutation = (idToken: string, userId: string, vsCodeInstanceId: string, isProduction: boolean) => {
  return client(idToken, isProduction)
    .hydrated()
    .then(async client => {
      return client.mutate({
        mutation: gql(`
          mutation RemoveVSCodeInstance {
            removeVSCodeInstance(userId: "${userId}", vsCodeInstanceId: "${vsCodeInstanceId}") {
              userId
              vsCodeInstanceId
              privateDirectories
              packageJsonParams {
                languages
                name
              }
            }
          }
        `),
      });
    });
};

export const auth0Client = (isProduction: boolean) => {
  return new AuthenticationClient({
    domain: isProduction ? AUTH0_URL : DEV_AUTH0_URL,
    clientId: isProduction ? AUTH0_CLIENT_ID : AUTH0_DEV_CLIENT_ID
  });
};