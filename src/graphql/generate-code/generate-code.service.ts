import { GenerateCodeParameters } from './../../interfaces/generate-code.interface';
import { GenerateVsCodeDownloadCode } from "./generate-code.queries";
import axios from 'axios';

export const generateCode = async ({
    generateVsCodeDownloadCodeParameters: GenerateCodeParameters
  }: any) => {
    
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