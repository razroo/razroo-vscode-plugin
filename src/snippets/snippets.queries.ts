import { URL_GRAPHQL, URL_PROD_GRAPHQL } from "graphql/awsConstants";
import axios from 'axios';

export async function getSnippetTemplates(search: string, orgId: string, 
    path: string, isProduction: boolean, accessToken: string) {
    const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
    const body = {
      query: `query templates($search: String!, $orgId: String!, $path: String!) {
        templates(search: $search, orgId: $orgId, path: $path, snippet: true) {
            id
            title
          }
        }`,
      variables: {
        search: search,
        orgId: orgId,
        path: path
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
      return response?.data;
    } catch (error) {    
      console.log('error updatePrivateDirectoriesRequest', error);
      return error;
    }
  };