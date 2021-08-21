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
const client = new AWSAppSyncClient({
  url: url,
  region: region,
  auth: {
    type,
    jwtToken:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxMUXNrcU9mSThQWU1EUmx1V1NHNCJ9.eyJuaWNrbmFtZSI6ImZlZGU5NjEyIiwibmFtZSI6ImZlZGVyaWNvZmVycmV5cmEyQGdtYWlsLmNvbSIsInBpY3R1cmUiOiJodHRwczovL2F2YXRhcnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMzI4MDUzNjk_dj00IiwidXBkYXRlZF9hdCI6IjIwMjEtMDgtMjBUMTQ6MzI6MTkuMzMxWiIsImVtYWlsIjoiZmVkZXJpY29mZXJyZXlyYTJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vaWQucmF6cm9vLmNvbS8iLCJzdWIiOiJnaXRodWJ8MzI4MDUzNjkiLCJhdWQiOiJBMHRMUllZZnlHR3R3eUM0b2RWaDUwam1VWktXOGJWSiIsImlhdCI6MTYyOTU0NDAwMiwiZXhwIjoxNjI5NTgwMDAyLCJub25jZSI6IlVXRTNWV3BZZWxKLVIwNUxNbE5HTGtOS1dscE9ObGQzV1VNMFJFdGhRVlJaZVhBdWEwTmxTWFJPVVZGSiJ9.JjHVjj-Cw6PUsO22eoP0heLjUcasuj-wDlPOQmFg-_u7qB9npj3LUyNCpebW4hSsbhU0IhDJ5ba8dzvpYXiuNV3kc2QSFydSHtaDwe_h9G9Vn2XGabjnhZIgduEH5mbwZof0eChsQPIuBpvQ7c_jhuQxoKLtReozmlYtT8yK3iTri8O1HDCZeGnRagzoOVPz4x8cxY5gk094TrjnXxKNoCQiQe6PM4iDOX1U0TjQ3VlI-PSuwgcvmC7kOebpkHns3l7Skb1r1oVrFi4mANGVoMK7yOYjT6w8MSN1L3lFUoMWG1Bp-XAV-0TgjO-J6moCVa9EQBBiIWunOuXxkzWgjA',
  },
  //disableOffline: true      //Uncomment for AWS Lambda
});

export default client;
