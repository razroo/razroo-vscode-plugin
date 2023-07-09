import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../graphql/awsConstants';
import { GetStarterSteps } from './get-starter-steps.queries';
import axios from 'axios';
import { PROD_AWS_API_KEY, DEV_AWS_API_KEY } from '../constants';

export async function getStarterSteps(isProduction: boolean) {
  console.log('get path starters');
  const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
  const body = {
    query: GetStarterSteps
  };
  const apiKey =  isProduction ? PROD_AWS_API_KEY : DEV_AWS_API_KEY;

  try {
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'charset=utf-8',
        'X-API-KEY': `${apiKey}`,
      },
    });
    return response?.data?.data?.getStarterSteps;
  } catch (error) {    
    console.log('error generateVsCodeDownloadCode', error);
    return error;
  }
}