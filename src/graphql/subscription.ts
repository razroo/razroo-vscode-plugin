/**
 * This shows how to use standard Apollo client on Node.js
 */
(global as any).WebSocket = require('ws');
// https://github.com/matthew-andrews/isomorphic-fetch/issues/125
// Require exports file with endpoint and auth info
import { URL_GRAPHQL, REGION, URL_PROD_GRAPHQL } from './awsConstants';

// Require AppSync module
import { AWSAppSyncClient, AUTH_TYPE } from 'aws-appsync';



// Set up Apollo client
function client(accessToken: string, isProduction: boolean) {
  const type = AUTH_TYPE.OPENID_CONNECT;
  return new AWSAppSyncClient({
    url: isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL,
    region: REGION,
    auth: {
      type,
      jwtToken: accessToken,
    },
    disableOffline: true
  });
}

export default client;

// Set up Apollo client
export function authDataClient(isProduction: boolean) {
  const type = AUTH_TYPE.API_KEY;
  return new AWSAppSyncClient({
    url: isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL,
    region: REGION,
    auth: {
      type,
      apiKey: 'da2-pineeux4cnaobnb5udeum2o5de'
    },
    disableOffline: true
  });
}
