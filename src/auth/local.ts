import express from 'express';
import cors from 'cors';

const AUTH_TIMEOUT_MS = 30000;

export interface CreateDisposableAuthServerPromiseResult {
    accessToken: string;
    refreshToken: string;
    userId: string;
    orgId: string;
}

export const createDisposableAuthServer = (timeout: number = AUTH_TIMEOUT_MS) => {
    let server;
    let done = false;
    const createServerPromise = new Promise<CreateDisposableAuthServerPromiseResult>((resolve, reject) => {
        setTimeout(() => {
            reject(`Auth timeout error. No response for ${(timeout / 1000)} seconds.`);
        }, timeout);
        try {
            const app = express();
            app.use(cors());
            app.use(express.json());
            app.post('/callback', (req, res) => {
              res.header('Access-Control-Allow-Origin', '*');
              res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
              res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                if (!done) {
                    const { accessToken, refreshToken, userId, orgId, error } = req.body;
                    // Have it error out if idtoken, refreshtoken, userId and orgId do not exists
                    if (!error && accessToken && refreshToken && userId && orgId) {
                        resolve({ accessToken, refreshToken, userId, orgId });
                    } else {
                        reject(error);
                    }
                    done = true;
                    res.send();
                } else {
                    res.sendStatus(403);
                }
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
        }
    };
};
