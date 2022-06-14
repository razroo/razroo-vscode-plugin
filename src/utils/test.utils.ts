import * as vscode from 'vscode';
import * as path from 'path';

const showInformationMessage = vscode.window.showInformationMessage;

export async function unitTestGeneratedFiles (tempFiles: string[], folderName: string){
    await Promise.all(tempFiles.map(async (file: any) => {
      if (file.includes(".spec")) {
        const unitTestFilePath = path.join(folderName, path.basename(file));
        const execution = new vscode.ShellExecution(`npm run test -- --test-file ${unitTestFilePath}`);
        const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
        // These two functions in tandem allow us to figure out when task completed
        const buildTasks = getBuildTasks();
        await executeBuildTask(task, path.basename(file));
      }
    }));
}

async function executeBuildTask(task: vscode.Task, fileName) {
    const execution = await vscode.tasks.executeTask(task);

    return new Promise<void>(resolve => {
        let disposable = vscode.tasks.onDidEndTask(e => {
            if (e.execution === execution) {
                showInformationMessage(`${fileName} has run successfully.`);
                // disposable.dispose();
                resolve();
            }
        });
    });
}

async function getBuildTasks() {
    return new Promise<vscode.Task[]>(resolve => {
        vscode.tasks.fetchTasks().then((tasks) => {
            resolve(tasks.filter((task) => task.group === vscode.TaskGroup.Build));
        });
    });
}