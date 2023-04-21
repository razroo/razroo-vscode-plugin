import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../../graphql/awsConstants';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse } from 'axios';

import { GetUserOrganizations } from './organizations.queries';

export const getUserOrganizations = async (
    userId: string,
    isProduction: boolean,
    accessToken: string
) => {
    const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
    const body = {
      query: GetUserOrganizations,
      variables: {
        userId
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
      return response?.data?.data?.userOrganizations;
    } catch (error) {    
      console.log('error userOrganizations', error);
      return error;
    }
  };