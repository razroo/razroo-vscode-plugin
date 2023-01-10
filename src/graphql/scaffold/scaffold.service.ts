import { MEMENTO_RAZROO_ACCESS_TOKEN } from './../../constants';
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../../graphql/awsConstants';
import * as vscode from 'vscode';
import axios from 'axios';
import { GetPathScaffolds } from './scaffold.queries';

export const getPathScaffolds = async (
    pathOrgId: string,
    pathId: string,
    context: vscode.ExtensionContext,
    isProduction: boolean
) => {
    const accessToken = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
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