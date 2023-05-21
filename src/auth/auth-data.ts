import { MEMENTO_RAZROO_ORG_ID } from './../constants';
import { authDataClient } from '../graphql/subscription';
import gql from 'graphql-tag';

export const subscribeToSendAuthData = async ({
  context, isProduction, uuid
}: any) => {
  //Subscribe with appsync client
  authDataClient(isProduction)
    .hydrated()
    .then(async function (client) {
      console.log('then is called');
      //Now subscribe to results
      const sendAuthDataSub$ = client.subscribe({
        query: gql(`subscription sendAuthDataSub($uuid: String!) {
            sendAuthDataSub(uuid: $uuid) {
              accessToken
              orgId
              refreshToken
              userId
              uuid
            }
          }
        `),
        variables: {
          uuid: uuid
        }
      });

      const error = async function error(data: any) {
        console.log('auth error');
        console.log(data);
      };

      const realtimeResults = async function realtimeResults(data: any) {
        // if a command is running, wait for it to complete until proceeding
        const sendAuthData = data;
        console.log('success');
        console.log(sendAuthData);
      };

      const complete = async function realtimeResults(data: any) {
        // if a command is running, wait for it to complete until proceeding
        const sendAuthData = data;
        console.log('success');
        console.log(sendAuthData);
      };


      sendAuthDataSub$.subscribe({
        next: realtimeResults,
        complete: console.log,
        error: error,
      });
    }).catch((error) => {
      // This function will be called if the client function returns a rejected Promise.
      console.error('rejected promise');
      console.error(error);

    });
};

