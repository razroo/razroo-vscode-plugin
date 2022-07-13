import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {saveTestOutputMutation} from './graphql.utils.js';

const showInformationMessage = vscode.window.showInformationMessage;

export async function unitTestGeneratedFiles(entryName: string, folderName: string, template: any, idToken, isProduction){
    if (entryName.includes(".spec")) {
        const unitTestFilePath = path.join(folderName, path.basename(entryName));
        const execution = new vscode.ShellExecution(`npm run test -- --test-file ${unitTestFilePath} --no-cache --skip-nx-cache --json --outputFile=razroo-unit-test-output.json`);
        const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
        // These two functions in tandem allow us to figure out when task completed
        const buildTasks = getBuildTasks();
        await executeBuildTask(task, path.basename(entryName), 'UnitTests', template, idToken, isProduction);
    }
}

export async function integrationTestGeneratedFiles(entryName: string, folderName: string, template:any,  idToken: string, isProduction: boolean){    
    if (entryName.includes(".spec")) {
        const unitTestFilePath = path.join(folderName, path.basename(entryName));
        const execution = new vscode.ShellExecution(`npm run e2e`);
        const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
        // These two functions in tandem allow us to figure out when task completed
        const buildTasks = getBuildTasks();
        await executeBuildTask(task, path.basename(entryName), 'IntegrationTests', template, idToken, isProduction);
    }
}

async function executeBuildTask(task: vscode.Task, fileName, testType, template, idToken, isProduction) {
    const execution = await vscode.tasks.executeTask(task);

    return new Promise<void>(resolve => {
        let disposable = vscode.tasks.onDidEndTask(async (e) => {
            if (e.execution === execution) {
                showInformationMessage(`${fileName} has run successfully.`);
                const testOutputPath = path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath as any + '/', 'razroo-unit-test-output.json');    
                let testOutputContent = fs.readFileSync(testOutputPath, 'utf-8');
                testOutputContent = JSON.stringify(testOutputContent);
                await cleanWorkspace();
                //send mutation with results
                saveTestOutputMutation(idToken, isProduction, testType, testOutputContent, template.orgId, template.pathId, template.recipeId, template.id ).then((data:any)=>{
                    console.log('data from mutation: ', data?.data?.saveTestOutput)
                })
                // disposable.dispose();
                resolve();
            }
        });
    });
}

async function cleanWorkspace() {
    const execution = new vscode.ShellExecution(`git clean -d -f`);
    const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
    vscode.tasks.executeTask(task);
    showInformationMessage(`Razroo Workspace has been reset.`);
}

async function getBuildTasks() {
    return new Promise<vscode.Task[]>(resolve => {
        vscode.tasks.fetchTasks().then((tasks) => {
            resolve(tasks.filter((task) => task.group === vscode.TaskGroup.Build));
        });
    });
}