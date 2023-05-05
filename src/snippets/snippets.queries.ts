import * as vscode from 'vscode';
import { getAccessToken } from "../graphql/expired";
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from "../graphql/awsConstants";
import axios from 'axios';

export async function getSnippetTemplates(search: string, orgId: string, 
    path: string, isProduction: boolean, context: vscode.ExtensionContext) {
    const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
    const body = {
      query: `query templates($search: String, $orgId: String, $path: String) {
        templates(search: $search, orgId: $orgId, path: $path, snippet: true) {
            id
            recipeId
            orgId
            pathId
            title
            instructionalContent
            parameters {
              defaultValue
              description
              inputType
              name
              type
              optionalTypes {
                name
                selected
              }
              paramType
            }
          }
        }`,
      variables: {
        search: search,
        orgId: orgId,
        path: path
      }
    };
    try {
      const accessToken = await getAccessToken(context, isProduction);
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'charset=utf-8',
          Authorization: `${accessToken}`,
        },
      });
      return response?.data?.data?.templates;
    } catch (error) {    
      console.log('error getSnippetTemplates', error);
      return error;
    }
  };