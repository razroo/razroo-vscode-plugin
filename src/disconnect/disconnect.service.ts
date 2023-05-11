import { URL_GRAPHQL, URL_PROD_GRAPHQL } from "../graphql/awsConstants";
import axios from 'axios';

export async function disconnectVsCodeInstance(accessToken: string, userId: string, vsCodeInstanceId: string, isProduction: boolean) {
    const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
    const body = {
      query: `mutation removeVSCodeInstance($userId: String!, $vsCodeInstanceId: String!) {
        removeVSCodeInstance(userId: $userId, vsCodeInstanceId: $vsCodeInstanceId) {
          userId
          vsCodeInstanceId
          privateDirectories
          packageJsonParams {
            languages
            name
          }
        }
      }`,
      variables: {
        userId,
        vsCodeInstanceId
      }
    };
    try {
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'charset=utf-8',
          Authorization: `${accessToken}`,
        },
      });
      console.debug('response');
      console.debug(response);
      return response?.data?.data?.removeVSCodeInstance;
    } catch (error) {
      console.log('error removeVSCodeInstance', error);
      return error;
    }
  };