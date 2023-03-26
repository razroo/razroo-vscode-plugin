import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../../graphql/awsConstants';
import axios from 'axios';
import { GetPathScaffolds } from './scaffold.queries';

export const getPathScaffolds = async (
    pathOrgId: string,
    pathId: string,
    accessToken: string,
    isProduction: boolean
) => {
    const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
    const body = {
      query: GetPathScaffolds,
      variables: {
        pathOrgId,
        pathId
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
      return response?.data?.data?.getPathScaffolds;
    } catch (error) {    
      console.log('error generateVsCodeDownloadCode', error);
      return error;
    }
  };