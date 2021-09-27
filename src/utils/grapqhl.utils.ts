import gql from 'graphql-tag';
import { MEMENTO_RAZROO_ID_TOKEN } from '../constants';
import client from '../graphql/subscription';
import { saveFiles } from './utils';

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

export const updatePrivateDirectoriesQuery =
  'mutation updateVSCodeAuthentication($updateVSCodeAuthenticationParameters: UpdateVSCodeAuthenticationInput) ' +
  '{ updateVSCodeAuthentication(updateVSCodeAuthenticationParameters: $updateVSCodeAuthenticationParameters) ' +
  '{ githubId idToken refreshToken vsCodeInstanceId privateDirectories} }';
