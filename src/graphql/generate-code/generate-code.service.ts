import { MEMENTO_RAZROO_ACCESS_TOKEN } from './../../constants';
import { GenerateCodeParameters } from './../../interfaces/generate-code.interface';
import { GenerateVsCodeDownloadCode } from "./generate-code.queries";
import * as vscode from 'vscode';
import axios from 'axios';

export const generateCode = async (
    generateVsCodeDownloadCodeParameters: GenerateCodeParameters,
    context: vscode.ExtensionContext
) => {
    const accessToken = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
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
      console.log('error updatePrivateDirectoriesRequest', error);
      return error;
    }
  };