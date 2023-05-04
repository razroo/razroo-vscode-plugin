import { setCommandStatus } from '../../utils/graphql.utils';
import { DEV_APP_URL, MEMENTO_RAZROO_ACCESS_TOKEN, PROD_APP_URL } from '../../constants';
import * as vscode from 'vscode';
import { join } from 'path';
import { readFileSync } from 'fs';
import { uploadPreviewFile } from '../../preview/preview.mutations';
import { MEMENTO_RAZROO_ORG_ID } from '../../constants';

export async function runRazrooCommand(commandToExecute: string, parametersParsed: any,isProduction: any, template: any, runPreviewGeneration: boolean, folderRoot: string, context: any) {  
  let execution;
  const userOrgId = context.globalState.get(MEMENTO_RAZROO_ORG_ID);
  const accessToken = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  if(runPreviewGeneration) {
    execution = new vscode.ShellExecution(commandToExecute + ' >> terminal-output.txt');
  } else {
    execution = new vscode.ShellExecution(commandToExecute);
  }
  const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
  await executeCommandTask(task, parametersParsed, isProduction, template, runPreviewGeneration, folderRoot, userOrgId, accessToken);
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

async function executeCommandTask(task: vscode.Task, parametersParsed: any,isProduction: any, template: any, runPreviewGeneration: boolean, folderRoot: string, userOrgId: string, accessToken: string) {
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
                setCommandStatus(true);
                vscode.window.showInformationMessage(`Command has run successfully.`);
                if(containsInfrastructureCommandPath(parametersParsed)) {
                  await openWorkspaceInNewCodeEditor(parametersParsed.fileName, parametersParsed.infrastructureCommandPath);
                  resolve();
                } else if(runPreviewGeneration) {
                  const commandOutputFile = join(folderRoot, 'terminal-output.txt');
                  let commandOutputFileText = readFileSync(commandOutputFile, 'utf-8');
                  await uploadPreviewFile(userOrgId, template.orgId, commandOutputFileText, 
                    'terminal-output.txt', '.txt', template.pathId, 
                    template.recipeId, template.stepId, 
                    isProduction, accessToken);
                }
                else {
                  resolve();
                }
            }
        });
    });
}