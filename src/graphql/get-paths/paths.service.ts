import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../../graphql/awsConstants';
import { GetPaths } from "./paths.queries";
import axios from 'axios';

export const getPaths = async (
    orgId: string,
    accessToken: string,
    isProduction: boolean
) => {
    const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
    const body = {
      query: GetPaths,
      variables: {
        orgId
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
      
      return response?.data.data?.getPaths;
    } catch (error) {    
      console.log('error generateVsCodeDownloadCode', (error as any).response?.data?.errors);
      return error;
    }
  };