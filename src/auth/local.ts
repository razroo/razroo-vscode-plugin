import express from 'express';
import cors from 'cors';

const AUTH_TIMEOUT_MS = 3_000_00;

export interface CreateDisposableAuthServerPromiseResult {
    idToken: string;
    refreshToken: string;
    userId: string;
}

export const createDisposableAuthServer = (timeout: number = AUTH_TIMEOUT_MS) => {
    let server;
    const createServerPromise = new Promise<CreateDisposableAuthServerPromiseResult>((resolve, reject) => {
        setTimeout(() => {
            reject(`Auth timeout error. No response for ${(timeout / 1000)} seconds.`);
        }, timeout);
        try {
            const app = express();
            app.use(cors());
            app.use(express.json());
            app.post('/callback', (req, res) => {
                const { idToken, refreshToken, userId, error } = req.body;
                if (!error) {
                    resolve({ idToken, refreshToken, userId } as any);
                } else {
                    reject(error);
                }
                res.send({});
            });

            server = app.listen(8350);
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
        },
    };
};
