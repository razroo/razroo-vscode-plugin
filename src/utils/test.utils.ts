import * as vscode from 'vscode';

export function unitTestGeneratedFiles(unitTestWithFilePath) {
    const execution = new vscode.ShellExecution(`npm run test ${unitTestWithFilePath}`);
    const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
    vscode.tasks.executeTask(task);
}

