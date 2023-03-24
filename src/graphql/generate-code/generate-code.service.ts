import { MEMENTO_RAZROO_ACCESS_TOKEN } from './../../constants';
import { URL_GRAPHQL, URL_PROD_GRAPHQL } from '../../graphql/awsConstants';
import { GenerateCodeParameters } from './../../interfaces/generate-code.interface';
import { GenerateVsCodeDownloadCode } from "./generate-code.mutations";
import * as vscode from 'vscode';
import axios from 'axios';

export const generateVsCodeDownloadCode = async (
    generateVsCodeDownloadCodeParameters: GenerateCodeParameters,
    context: vscode.ExtensionContext,
    isProduction: boolean
) => {
    const accessToken = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
    const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
    const body = {
      query: GenerateVsCodeDownloadCode,
      variables: {
        generateVsCodeDownloadCodeParameters
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
      console.log('error generateVsCodeDownloadCode', error);
      return error;
    }
  };