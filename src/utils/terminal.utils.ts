import * as cp from "child_process";

async function execShell(cmd: string) {
    return new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });
}

//example, will be removed once fully integrated
const currentDir = execShell('pwd').then(data => {
    console.log('data');
    console.log(data);
});
