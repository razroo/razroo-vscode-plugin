import * as vscode from 'vscode';
import * as path from 'path';
import { cleanWorkspace, getBuildTasks } from '../utils/terminal-utils/terminal-utils';

const showInformationMessage = vscode.window.showInformationMessage;

export async function generatePreviewFiles(entryName: string, folderName: string, template: any, accessToken: string, isProduction: boolean){
    // entryName will always be unit test
    // spec logic put in place just to make sure nothing bad happens
    const execution = new vscode.ShellExecution(`npm run build`);
    const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
    // These two functions in tandem allow us to figure out when task completed
    const buildTasks = getBuildTasks();
    await executeBuildTask(task, path.basename(entryName), 'UnitTests', template, accessToken, isProduction);
}

async function executeBuildTask(task: vscode.Task, fileName, testType, template, accessToken, isProduction) {
    const execution = await vscode.tasks.executeTask(task);

    return new Promise<void>(resolve => {
        let disposable = vscode.tasks.onDidEndTask(async (e) => {
            if (e.execution === execution) {
                showInformationMessage(`generate preview build has run successfully.`);
                // await cleanWorkspace();
                //send mutation with results
                // saveTestOutputMutation(accessToken, isProduction, testType, testOutputContent, template.orgId, template.pathId, template.recipeId, template.id ).then((data:any)=>{
                //     console.log('data from mutation: ', data?.data?.saveTestOutput);
                // });
                disposable.dispose();
                resolve();
            }
        });
    });
}
