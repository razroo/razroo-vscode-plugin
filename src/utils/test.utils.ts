import * as vscode from 'vscode';
import * as path from 'path';

const showInformationMessage = vscode.window.showInformationMessage;

export async function unitTestGeneratedFiles (tempFiles: string[], folderName: string){
    await Promise.all(tempFiles.map(async (file: any) => {
      if (file.includes(".spec")) {
          const unitTestFilePath = path.join(folderName, path.basename(file));
          const execution = new vscode.ShellExecution(`npm run test -- --test-file ${unitTestFilePath}`);
          const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
          vscode.tasks.executeTask(task);
      }
    }));

    showInformationMessage('Razroo unit tests have run successfully.');
}

