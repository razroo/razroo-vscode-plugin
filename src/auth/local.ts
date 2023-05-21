import express from 'express';
import cors from 'cors';
import { subscribeToSendAuthData } from './auth-data';

const AUTH_TIMEOUT_MS = 30000;

export interface CreateDisposableAuthServerPromiseResult {
    accessToken: string;
    refreshToken: string;
    userId: string;
    orgId: string;
}

export const createDisposableAuthServer = (isProduction: boolean, uuid: string, timeout: number = AUTH_TIMEOUT_MS) => {
    let server;
    let done = false;
    const createServerPromise = new Promise<CreateDisposableAuthServerPromiseResult>((resolve, reject) => {
        setTimeout(() => {
            reject(`Auth timeout error. No response for ${(timeout / 1000)} seconds.`);
        }, timeout);
        try {
          subscribeToSendAuthData({isProduction, uuid, resolve});
        } catch (error: any) {
            reject(error);
        }
    });

    return {
        createServerPromise,
        dispose: () => {
            if (server) {
                server.close(() => {
                  console.log('Server closed');
                });
            }
        }
    };
};
