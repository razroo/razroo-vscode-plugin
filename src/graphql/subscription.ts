/**
 * This shows how to use standard Apollo client on Node.js
 */
(global as any).WebSocket = require('ws');
require('es6-promise').polyfill();
// https://github.com/matthew-andrews/isomorphic-fetch/issues/125
require('cross-fetch');

// Require exports file with endpoint and auth info
import { URL_GRAPHQL, REGION, URL_PROD_GRAPHQL } from './awsConstants';

// Require AppSync module
import { AWSAppSyncClient, AUTH_TYPE } from 'aws-appsync';

const type = AUTH_TYPE.OPENID_CONNECT;

// Set up Apollo client
function client(accessToken: string, isProduction: boolean) {
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
