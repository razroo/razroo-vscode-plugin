import { VersionControlParams } from './../projects/interfaces/project-config.interfaces';
import { ProjectConfig } from '../projects/interfaces/project-config.interfaces';
import gql from 'graphql-tag';
import parseGitConfig from 'parse-git-config';
import getBranch from 'git-branch';
import { AUTH0_URL, DEV_AUTH0_URL, AUTH0_DEV_CLIENT_ID, AUTH0_CLIENT_ID, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_USER_ID, MEMENTO_RAZROO_ORG_ID } from '../constants';
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../graphql/awsConstants';
import client from '../graphql/subscription';
import { saveFiles, tryToAuth, updatePrivateDirectoriesInVSCodeAuthentication } from './utils';
import axios from 'axios';
import { determineLanguagesUsed, getProjectDependencies, readPackageJson } from '@codemorph/core';
import * as vscode from 'vscode';
import { join } from 'path';
import { readNxJson } from './nx.utils';
import { AuthenticationClient } from 'auth0';
import { isTokenExpired } from './date/date.utils';
import { createVSCodeIdToken, getOrCreateAndUpdateIdToken } from './token/token';
import { determineLanguagesWithVersionUsed } from 'package-json-manager';

export const subscribeToGenerateVsCodeDownloadCodeSub = async ({
  context, 
  isProduction,
  projectsProvider,
  selectedProjects,
  userId
}: any) => {
  //Subscribe with appsync client
  for(let selectedProject of selectedProjects) {
    const vsCodeInstanceId = createVSCodeIdToken(userId, selectedProject.versionControlParams);
    client(context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN), isProduction)
    .hydrated()
    .then(async function (client) {
      //Now subscribe to results
      const generateVsCodeDownloadCodeSub$ = client.subscribe({
        query: gql(`
        subscription GenerateVsCodeDownloadCodeSub {
            generateVsCodeDownloadCodeSub(vsCodeInstanceId: "${vsCodeInstanceId}") {
              vsCodeInstanceId
              downloadUrl
              parameters
              runUnitTests
              runIntegrationTests
              template {
                orgId
                pathId
                recipeId
                id
                type
                updates
                filesToGenerate
                baseCommunityPath
                parameters {
                  defaultValue
                  description
                  inputType
                  name
                  optionalTypes {
                    name
                    selected
                  }
                  paramType
                  type
                }
              }
            }
          }
        `)
      });

      const realtimeResults = async function realtimeResults(data: any) {
        // Save the files in a new folder
        const path = selectedProject.versionControlParams.path;
        await saveFiles(data, context, isProduction, path);
        await updatePrivateDirectoriesPostCodeGeneration(context, isProduction, selectedProjects);
      };

      const error = async function error(data: any) {
        //Save the files in a new folder
        await generateVsCodeDownloadCodeSubError(data, context, isProduction, projectsProvider, selectedProjects);
      };

      generateVsCodeDownloadCodeSub$.subscribe({
        next: realtimeResults,
        complete: console.log,
        error: error,
      });
    }).catch(async function (error) {
      // This function will be called if the client function returns a rejected Promise.
      console.error(error);

      await fallback(context);
    });
  }
};

async function fallback(content) {
  console.log('content');
  console.log(content);
}

async function updatePrivateDirectoriesPostCodeGeneration(context, isProduction: boolean, allPackageJsons) {
  const userId = context.globalState.get(MEMENTO_RAZROO_USER_ID);
  const accessToken = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  const orgId = context.globalState.update(MEMENTO_RAZROO_ORG_ID);
  await updatePrivateDirectoriesInVSCodeAuthentication(accessToken, isProduction, userId, orgId, allPackageJsons);
}

async function generateVsCodeDownloadCodeSubError(data: any, context, isProduction: boolean, projectsProvider, allPackageJsons) {
  let accessToken = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  
  if(isTokenExpired(accessToken as string)) {
    vscode.window.showInformationMessage(
      'Authentication Token Expired. Re-logging you in now.'
    );

    tryToAuth(context, isProduction, projectsProvider, allPackageJsons);
  }
  return data;
}

export async function getVersionControlParams(workspacePath: string) {
  const gitOrigin = await parseGitConfig({ cwd: workspacePath, path: '.git/config' }).then(gitConfig => gitConfig?.['remote "origin"']?.url);
  const gitBranch = await getBranch(workspacePath);

  return {
    gitOrigin,
    gitBranch,
  };
}

export async function getPackageJson(workspacePath: string) {
  const packageJsonFilePath = join(workspacePath, 'package.json');
  const packageJson = await readPackageJson(packageJsonFilePath);
  const projectDependenciesMap = await getProjectDependencies(vscode.workspace.workspaceFolders?.[0].uri.fsPath as any);
  const transformedProjectDependencies = await determineLanguagesWithVersionUsed(projectDependenciesMap);
  const nx = await readNxJson(workspacePath);

  const newlyTransformedJson = {
    name: packageJson ? packageJson.name : '',
    version: packageJson ? packageJson.version : '0.0.0',
    languages: transformedProjectDependencies,
    nx: nx
  };
  return JSON.stringify(newlyTransformedJson);
}

export const updatePrivateDirectoriesRequest = async ({
  vsCodeInstanceId,
  accessToken,
  privateDirectories,
  isProduction,
  userId,
  orgId,
  packageJsonParams
}: any) => {
  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  
  let versionControlsParams = {
    gitBranch: '',
    gitOrigin: ''
  };
  if(privateDirectories.length && packageJsonParams){
    versionControlsParams = await getVersionControlParams(workspacePath as string);
  } else {
    packageJsonParams = `{"name":"${vscode.workspace.name}","languages":[],"nx":{}}`;
  }
  const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
  const body = {
    query: `mutation updateVSCodeAuthentication($userId: String!, $orgId: String!, $projectName: String!, $vsCodeInstanceId: String!, $privateDirectories: String, $packageJsonParams: AWSJSON, $versionControlsParams: VersionControlsParamsInput) {
        updateVSCodeAuthentication(userId: $userId, orgId: $orgId, projectName: $projectName, vsCodeInstanceId: $vsCodeInstanceId, privateDirectories: $privateDirectories, packageJsonParams: $packageJsonParams, versionControlsParams: $versionControlsParams) {
          privateDirectories
          orgId
          projectName
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
      orgId: orgId,
      projectName: JSON.parse(packageJsonParams)?.name,
      vsCodeInstanceId,
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
        Authorization: `${accessToken}`,
      },
    });
    return response?.data;
  } catch (error) {    
    console.log('error updatePrivateDirectoriesRequest', error);
    return error;
  }
};

export const removeVsCodeInstanceMutation = (accessToken: string, userId: string, vsCodeInstanceId: string, isProduction: boolean) => {
  return client(accessToken, isProduction)
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
export const saveTestOutputMutation = (accessToken: string, isProduction: boolean, testType: string,
  jsonObject: string,
  orgId: string,
  pathId: string,
  recipeId: string,
  stepId: string) => {
  return client(accessToken, isProduction)
    .hydrated()
    .then(async client => {
      return client.mutate({
        mutation: gql(`
          mutation saveTestOutput {
            saveTestOutput(
              testType: ${testType}, 
              jsonObject: ${jsonObject}, 
              orgId: "${orgId}", 
              pathId: "${pathId}", 
              recipeId: "${recipeId}", 
              stepId: "${stepId}") {
                author
                baseCommunityPath
                codePath
                count
                description
                filesToGenerate
                id
                instructionalContent
                integrationTestsFailed
                integrationTestsPassed
                isPublished
                lastUpdated
                next
                orgId
                pathId
                prev
                recipeId
                relevantQuestions
                timestamp
                title
                type
                unitTestsFailed
                unitTestsPassed
                updates
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