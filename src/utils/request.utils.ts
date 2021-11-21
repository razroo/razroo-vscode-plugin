import axios from 'axios';
import { URL_API_GATEWAY, URL_API_GATEWAY_PROD} from '../graphql/awsConstants';

export const getVSCodeAuthentication = async ({ vsCodeInstanceId, isProduction }: any) => {
  let response: any;
  const URL_API_GATEWAY_URL = isProduction ? URL_API_GATEWAY_PROD : URL_API_GATEWAY;
  const url =
    URL_API_GATEWAY_URL + `/authenticationVSCode/vsCodeInstanceId/${vsCodeInstanceId}`;
  try {
    response = await axios.get(`${url}`);
    return {
      vsCodeAuthInfo: response.data?.vsCodeAuthInfo,
      status: response.status,
    };
  } catch (error) {
    console.log('error getVSCodeAuthentication', error);
    return { vsCodeAuthInfo: undefined, status: response?.status };
  }
};

export const getFileS3 = async ({ url }: any) => {
  let response: any;
  try {
    response = await axios.request({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
    });
  } catch (error) {
    console.log('error getFileS3', error);
    return null;
  }
  return response?.data;
};
