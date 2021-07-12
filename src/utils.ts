import { v4 as uuidv4 } from 'uuid';
import { AUTH0URL } from './constants';

export const validateEmail = (email: string) => {
    const res = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return res.test(String(email).toLowerCase()) ? undefined : email;
};

export const getAuth0Url = () => {
    const draftToken = uuidv4();
    const loginUrl = AUTH0URL + `?token=${draftToken}`;
    return loginUrl;
}