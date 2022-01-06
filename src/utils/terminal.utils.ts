import * as cp from "child_process";

export async function execShell(cmd: string, cwd: string) {
    return new Promise<string>((resolve, reject) => {
        cp.exec(cmd, {cwd: cwd}, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });
}