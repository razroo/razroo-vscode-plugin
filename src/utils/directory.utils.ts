import * as vscode from 'vscode';

export function getWorkspaceFolders() {
  console.log("VSCODE WORKSPACE FOLDERS: ", vscode.workspace?.workspaceFolders);
  return vscode.workspace?.workspaceFolders?.map((folder) => {
    return { name: folder.name, path: folder?.uri?.fsPath };
  });
};