import axios from 'axios';

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
