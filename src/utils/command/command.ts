import * as vscode from 'vscode';

export function containsInfrastructureCommandPath(text: string) : boolean {
  return text.includes('<%= infrastructureCommandPath %>');
}

export function openWorkspaceInNewCodeEditor(infastructureCommandPath: string, fileName: string) {
  const commandToExecute = infastructureCommandPath ? `open -a "Visual Studio Code" ${infastructureCommandPath}/${fileName}` : `open -a "Visual Studio Code" ${fileName}`;
  const execution = new vscode.ShellExecution(commandToExecute);
  const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
  vscode.tasks.executeTask(task);  
}