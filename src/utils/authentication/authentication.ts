import { RAZROO_URL, RAZROO_DEV_URL } from './../../constants';

export const getAuth0Url = (isProduction: boolean) => {
  const host = isProduction === true ? RAZROO_URL : RAZROO_DEV_URL;
  return `${host}/api/auth/login`;
};