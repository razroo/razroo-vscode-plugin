'use strict';
/**
 * This shows how to use standard Apollo client on Node.js
 */

(global as any).WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');

// Require exports file with endpoint and auth info
import { URL_GRAPHQL, REGION } from './awsConstants';

// Require AppSync module
import { AUTH_TYPE } from 'aws-appsync/lib/client';
import { AWSAppSyncClient } from 'aws-appsync';

const type = AUTH_TYPE.OPENID_CONNECT;

// Set up Apollo client
function client(idToken: string) {
  return new AWSAppSyncClient({
    url: URL_GRAPHQL,
    region: REGION,
    auth: {
      type,
      jwtToken: idToken,
    },
    disableOffline: true
  });
}

export default client;
