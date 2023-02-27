import { DEV_APP_URL, PROD_APP_URL } from '../../constants';
import * as vscode from 'vscode';

export async function runRazrooCommand(commandToExecute: string, parametersParsed: any,isProduction: any, template: any) {  
  const execution = new vscode.ShellExecution(commandToExecute);
  const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
  await vscode.tasks.executeTask(task);
  const commandTasks = getCommandTasks();
  await executeCommandTask(task, parametersParsed, isProduction, template);
}

export function containsInfrastructureCommandPath(parametersParsed: any): boolean {
  return parametersParsed.infrastructureCommandPath;
}

export async function openWorkspaceInNewCodeEditor(fileName: string, infrastructureCommandPath: string) {
  const commandToExecute = `cd ${infrastructureCommandPath}; open -a "Visual Studio Code" ${fileName}`;
  const execution = new vscode.ShellExecution(commandToExecute);
  const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
  await vscode.tasks.executeTask(task);  
}

async function getCommandTasks() {
  return new Promise<vscode.Task[]>(resolve => {
    vscode.tasks.fetchTasks().then((tasks) => {
      resolve(tasks.filter((task) => task.group === vscode.TaskGroup.Build));
    });
  });
}

async function executeCommandTask(task: vscode.Task, parametersParsed: any,isProduction: any, template: any) {
    const execution = await vscode.tasks.executeTask(task);
    const {orgId, pathId, recipeId, id } = template;
    const razrooStepURL = `${isProduction ? PROD_APP_URL : DEV_APP_URL}/${orgId}/${pathId}/${recipeId}/${id}`;
    const openLinkCommand = {
      title: 'Open in Razroo',
      command: 'extension.openLink'
    };
    vscode.window.showInformationMessage(razrooStepURL,openLinkCommand).then(selection=>{
      if(selection && selection.command === 'extension.openLink') {
        vscode.env.openExternal(vscode.Uri.parse(`${razrooStepURL}`));
      };
    });

    return new Promise<void>(resolve => {
        let disposable = vscode.tasks.onDidEndTask(async (e) => {
            if (e.execution === execution) {
                vscode.window.showInformationMessage(`Command has run successfully.`);
                if(containsInfrastructureCommandPath(parametersParsed)) {
                  await openWorkspaceInNewCodeEditor(parametersParsed.fileName, parametersParsed.infrastructureCommandPath);
                  resolve();
                }
                else {
                  resolve();
                }
            }
        });
    });
}