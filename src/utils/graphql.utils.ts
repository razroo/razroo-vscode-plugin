import gql from 'graphql-tag';
import { MEMENTO_RAZROO_ID_TOKEN } from '../constants';
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../graphql/awsConstants';
import client from '../graphql/subscription';
import { saveFiles } from './utils';
import axios from 'axios';

export const subscribeToGenerateVsCodeDownloadCodeSub = ({
  vsCodeInstanceId,
  context,
}: any) => {
  //Query to subscribe in graphql
  const subquery = gql(`
subscription MySubscription {
    generateVsCodeDownloadCodeSub(vsCodeInstanceId: "${vsCodeInstanceId}") {
      vsCodeInstanceId
      downloadUrl
      parameters
      customInsertPath
    }
  }
`);

let isProduction = context.extensionMode === 1;
  //Subscribe with appsync client
  client(`${context.workspaceState.get(MEMENTO_RAZROO_ID_TOKEN)}`, isProduction)
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

export const updatePrivateDirectoriesQuery =
  'mutation updateVSCodeAuthentication($updateVSCodeAuthenticationParameters: UpdateVSCodeAuthenticationInput) ' +
  '{ updateVSCodeAuthentication(updateVSCodeAuthenticationParameters: $updateVSCodeAuthenticationParameters) ' +
  '{ userId idToken refreshToken vsCodeInstanceId privateDirectories} }';

export const updatePrivateDirectoriesRequest = async ({
  vsCodeToken,
  idToken,
  privateDirectories,
  isProduction,
}: any) => {
  const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
  const body = {
    query: updatePrivateDirectoriesQuery,
    variables: {
      updateVSCodeAuthenticationParameters: {
        vsCodeInstanceId: vsCodeToken,
        updatedParameters: `{\"privateDirectories\":\"${privateDirectories}\"}`,
      },
    },
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
