'use strict';
/**
 * This shows how to use standard Apollo client on Node.js
 */

(global as any).WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');

// Require exports file with endpoint and auth info
import aws_exports from './aws-exports';

// Require AppSync module
import { AUTH_TYPE } from 'aws-appsync/lib/client';
import { AWSAppSyncClient } from 'aws-appsync';

const url = aws_exports.ENDPOINT;
const region = aws_exports.REGION;
const type = AUTH_TYPE.OPENID_CONNECT;

// Set up Apollo client
function client(idToken: string) {
  return new AWSAppSyncClient({
    url: url,
    region: region,
    auth: {
      type,
      jwtToken: idToken,
    },
    //disableOffline: true      //Uncomment for AWS Lambda
  });
}

export default client;
