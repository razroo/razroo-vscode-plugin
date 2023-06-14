import gql from 'graphql-tag';
import parseGitConfig from 'parse-git-config';
import { AUTH0_DEV_CLIENT_ID, AUTH0_CLIENT_ID, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_USER_ID, MEMENTO_RAZROO_ORG_ID, AUTH0_DOMAIN, DEV_AUTH0_URL, AUTH0_AUDIENCE, AUTH0_URL } from '../constants';
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../graphql/awsConstants';
import client from '../graphql/subscription';
import { saveFiles, tryToAuth, updatePrivateDirectoriesInVSCodeAuthentication } from './utils';
import * as vscode from 'vscode';
import { isTokenExpired } from './date/date.utils';
import { createVSCodeIdToken } from './token/token';
import axios, { AxiosRequestConfig } from 'axios';
let commandIsCalled = true;

export function setCommandStatus(commandStatus: boolean) {
  commandIsCalled = commandStatus;
}

export function getCommandStatus() {
  commandIsCalled;
}

export const subscribeToGenerateVsCodeDownloadCodeSub = async ({
  context, 
  isProduction,
  projectsProvider,
  selectedProjects,
  userId
}: any) => {
  //Subscribe with appsync client
  for(let selectedProject of selectedProjects) {
    const userOrgId = context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string;
    const vsCodeInstanceId = createVSCodeIdToken(userId, userOrgId, selectedProject.versionControlParams, selectedProject.packageJsonParams, selectedProject.folderName);
    client(context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN), isProduction)
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
              runPreviewGeneration
              template {
                orgId
                pathId
                recipeId
                id
                type
                title
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

      const error = async function error(data: any) {
        //Save the files in a new folder
        await generateVsCodeDownloadCodeSubError(data, context, isProduction, projectsProvider, selectedProjects);
      };

      const realtimeResults = async function realtimeResults(data: any) {
        // if a command is running, wait for it to complete until proceeding
        await waitForCommand().then(async () => {
          const path = selectedProject.versionControlParams.path;
          await saveFiles(data?.data?.generateVsCodeDownloadCodeSub, context, isProduction, path);
          await updatePrivateDirectoriesPostCodeGeneration(context, isProduction, selectedProjects);
        });
      };

      const waitForCommand = async function waitForCommand() {
        return new Promise<void>((resolve) => {
          const intervalId = setInterval(() => {
            if(commandIsCalled) {
              clearInterval(intervalId);
              resolve();
            }
          }, 1000);
        });
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
  const accessToken = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  const orgId = context.globalState.get(MEMENTO_RAZROO_ORG_ID);
  await updatePrivateDirectoriesInVSCodeAuthentication(accessToken, isProduction, userId, orgId, allPackageJsons);
}

async function generateVsCodeDownloadCodeSubError(data: any, context, isProduction: boolean, projectsProvider, allPackageJsons) {
  let accessToken = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  
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
  // TODO - Re add this functionality when working as expected
  // const gitBranch = await getBranch(workspacePath);

  return {
    gitOrigin,
    gitBranch: '',
  };
}

export const updatePrivateDirectoriesRequest = async ({
  vsCodeInstanceId,
  accessToken,
  privateDirectories,
  isProduction,
  userId,
  orgId,
  packageJsonParams,
  versionControlParams,
  absoluteFolderRoot
}: any) => {
  const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
  const body = {
    query: `mutation updateVSCodeAuthentication($userId: String!, $orgId: String!, $projectName: String!, $vsCodeInstanceId: String!, $privateDirectories: String, $packageJsonParams: AWSJSON, $versionControlsParams: VersionControlsParamsInput, $absoluteFolderRoot: String) {
        updateVSCodeAuthentication(userId: $userId, orgId: $orgId, projectName: $projectName, vsCodeInstanceId: $vsCodeInstanceId, privateDirectories: $privateDirectories, packageJsonParams: $packageJsonParams, versionControlsParams: $versionControlsParams, absoluteFolderRoot: $absoluteFolderRoot) {
          privateDirectories
          orgId
          userId
          projectName
          vsCodeInstanceId
          packageJsonParams {
            name
            languages
            nx {
              defaultProject
            }
          }
          absoluteFolderRoot
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
      versionControlsParams: versionControlParams,
      absoluteFolderRoot
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

export async function refreshAuth0Token(refreshToken: string, isProduction: boolean) {
  const options = {
    method: "POST",
    url: isProduction ? `https://${AUTH0_URL}/oauth/token` : `https://${DEV_AUTH0_URL}/oauth/token` ,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: isProduction ? AUTH0_CLIENT_ID : AUTH0_DEV_CLIENT_ID,
      refresh_token: refreshToken as string,
      audience: AUTH0_AUDIENCE as string,
    }),
  };
  const response = await axios.request(options as AxiosRequestConfig);
  try {
    if (response.status === 200) {
      return response.data;
    } else {
      (response.data);
    }
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
      throw e;
    }
    else {
      throw e;
    }
  }
}