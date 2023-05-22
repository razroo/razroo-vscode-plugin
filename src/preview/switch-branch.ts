import * as vscode from 'vscode';

// we will switch users to unique branch when generating preview
export async function switchToActiveBranch(orgId: string, pathId: string, recipeId: string, stepId: string) {
  const branchName = `${orgId}/${pathId}/${recipeId}/${stepId}`;

  const execution = new vscode.ShellExecution(`git checkout -B ${branchName}`);
  const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo: Switch To Preview Branch', 'Razroo', execution);
  return await vscode.tasks.executeTask(task);
}