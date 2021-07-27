import { AUTH0URL } from './constants';

export const validateEmail = (email: string) => {
    const res = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return res.test(String(email).toLowerCase()) ? undefined : email;
};

export const getAuth0Url = (token: string, socketHost: string) => {
    const host = process.env.scope === 'DEVELOPMENT' ? 'http://localhost:4200' : AUTH0URL;
    const loginUrl =  `${host}?vscodeToken=${token}&socketVsCode=${socketHost}`;
    return loginUrl;
}