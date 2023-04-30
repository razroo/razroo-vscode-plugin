import { URL_GRAPHQL, URL_PROD_GRAPHQL } from "../graphql/awsConstants";
import axios from 'axios';

export async function uploadPreviewFile(userOrgId: string, templateOrgId: string,
    fileContent: string, fileName: string, fileType: string, pathId: string, 
    recipeId: string, stepId: string, isProduction: boolean, accessToken: string) {
    const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
    const body = {
      query: `mutation uploadPreviewFile($userOrgId: String!,
        $templateOrgId: String!,
        $fileContent: String!,
        $fileName: String!,
        $fileType: String!,
        $pathId: String!,
        $recipeId: String!,
        $stepId: String!) {
          uploadPreviewFile(userOrgId: $userOrgId, templateOrgId: $templateOrgId,
            fileContent: $fileContent, fileName: $fileName,
            fileType: $fileType, pathId: $pathId,
            recipeId: $recipeId, stepId: $stepId) {
              filePath
            }
        }`,
      variables: {
        userOrgId,
        templateOrgId,
        fileContent,
        fileName,
        fileType,
        pathId,
        recipeId,
        stepId
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
      return response?.data?.data?.uploadPreviewFile;
    } catch (error) {
      console.log('error uploadPreviewFile', error);
      return error;
    }
  };