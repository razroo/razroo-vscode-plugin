import { AUTH0URL } from './constants';
import * as request from 'request';

export const validateEmail = (email: string) => {
  const res =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return res.test(String(email).toLowerCase()) ? undefined : email;
};

export const getAuth0Url = (token: string, socketHost: string) => {
  const host =
    process.env.scope === 'DEVELOPMENT' ? 'http://localhost:4200' : AUTH0URL;
  const loginUrl = `${host}?vscodeToken=${token}&socketVsCode=${socketHost}`;
  return loginUrl;
};

export const existVSCodeAuthenticate = async (token: string) => {
  console.log('Start');
  let response;

  for (let i = 0; i < 1; ) {
    // const url = 'http://localhost:3000/dev/graphql';
    // const body = {
    //   query: `query Query($_vsCodeToken: String!) {
    //       authenticationVsCode(vsCodeToken: $_vsCodeToken) {
    //         vsCodeToken
    //         githubId
    //         idToken
    //         refreshToken
    //       }
    //     }`,
    //   variables: { _vsCodeToken: token },
    // };

    const url = 'https://dxmhv6e367.execute-api.us-east-1.amazonaws.com/Stage';
    request.get(
      {
        url: url + `/authenticationVSCode/vsCodeToken/${token}`,
      },
      async (error, response, body) => {
        console.log('response', response);
        console.log('body', body);
        console.log('error', error);
        body = JSON.parse(body);
        console.log(
          'authentication vscode',
          body?.authenticationVSCode?.vsCodeToken
        );
        console.log(
          'authentication vscode if',
          body?.authenticationVSCode?.vsCodeToken === token
        );
        if (
          body?.authenticationVSCode &&
          body?.authenticationVSCode?.vsCodeToken === token &&
          body?.statusCode === 200
        ) {
          console.log('Correct token');
          i++;
          response = body?.authenticationVSCode;
        }
      }
    );
    // response = await axios.get(`url/authenticationVSCode/vsCodeToken/${token}`);
    // if (
    //   response?.data?.authenticationVSCode &&
    //   Object.keys(response?.data?.authenticationVSCode).length
    // ) {
    //   i++;
    // }
    await sleep(3000);
  }
  console.log('End', response);
  return response;
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
