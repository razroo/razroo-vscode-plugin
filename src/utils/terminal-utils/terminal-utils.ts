import * as vscode from 'vscode';
const showInformationMessage = vscode.window.showInformationMessage;

export async function cleanWorkspace() {
  const execution = new vscode.ShellExecution(`git clean -d -f`);
  const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
  vscode.tasks.executeTask(task);
  showInformationMessage(`Razroo Workspace has been reset.`);
}

export async function getBuildTasks() {
  return new Promise<vscode.Task[]>(resolve => {
    vscode.tasks.fetchTasks().then((tasks) => {
      resolve(tasks.filter((task) => task.group === vscode.TaskGroup.Build));
    });
  });
}