import axios from 'axios';
import { URL_API_GATEGAY, URL_GRAPHQL } from '../graphql/awsConstants';
import { updatePrivateDirectoriesQuery } from './graphql.utils';

export const getVSCodeAuthentication = async ({ vsCodeInstanceId }: any) => {
  let response: any;
  const url =
    URL_API_GATEGAY +
    `/authenticationVSCode/vsCodeInstanceId/${vsCodeInstanceId}`;
  try {
    response = await axios.get(`${url}`);
    return {
      authenticationVSCode: response.data?.authenticationVSCode,
      status: response.status,
    };
  } catch (error) {
    console.log('error getVSCodeAuthentication', error);
    return { authenticationVSCode: undefined, status: response?.status };
  }
};

export const updatePrivateDirectoriesRequest = async ({
  vsCodeToken,
  idToken,
  privateDirectories,
}: any) => {
  const url = URL_GRAPHQL;
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
    await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'charset=utf-8',
        Authorization: `${idToken}`,
      },
    });
  } catch (error) {
    console.log('error updatePrivateDirectoriesRequest', error);
  }
};

export const getFileS3 = async ({ url }: any) => {
  let response: any;
  try {
    response = await axios.request({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
    });
  } catch (error) {
    console.log('error getFileS3', error);
    return null;
  }
  return response?.data;
};
