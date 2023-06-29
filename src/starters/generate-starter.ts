import * as vscode from 'vscode';
import { createRootPathForStarterRepo } from './starter-utils';

export async function openStarterInNewCodeEditor(context: vscode.ExtensionContext, projectName: string) {
    const starterRepoRoot = createRootPathForStarterRepo(context);
    const commandToExecute = `cd ${starterRepoRoot}; open -a "Visual Studio Code" ${projectName}`;
    const execution = new vscode.ShellExecution(commandToExecute);
    const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
    await vscode.tasks.executeTask(task);  
  }