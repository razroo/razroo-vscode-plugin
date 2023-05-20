import { MEMENTO_RAZROO_ORG_ID } from './../constants';
import client from '../graphql/subscription';
import gql from 'graphql-tag';

export async function subscribeToSendAuthData(context, isProduction: boolean, uuid: string) {
  //Subscribe with appsync client
  client(undefined as any, isProduction)
    .hydrated()
    .then((client) => {
      //Now subscribe to results
      const sendAuthDataSub$ = client.subscribe({
        query: gql(`
        subscription SendAuthDataSub {
          sendAuthDataSub(uuid: "${uuid}") {
              accessToken
              orgId
              refreshToken
              userId
              uuid
            }
          }
        `)
      });

      const error = async function error(data: any) {
        console.log('auth error');
        console.log(data);
      };

      const realtimeResults = async function realtimeResults(data: any) {
        // if a command is running, wait for it to complete until proceeding
        console.log('success');
        console.log(data);
      };


      sendAuthDataSub$.subscribe({
        next: realtimeResults,
        complete: console.log,
        error: error,
      });
    }).catch(async function (error) {
      // This function will be called if the client function returns a rejected Promise.
      console.error(error);

    });
  }
