import * as vscode from 'vscode';

// TODO - see if windows works - normalization of url
export function getNameFilePathFromFullPath(fullFilePath: string) {
  const rootDirectory = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.path : '';
  return fullFilePath.replace(rootDirectory + '/', '');
}

// TODO - see if windows works - normalization of url
export function getNameFromFullPath(fullFilePath: string) {
  return fullFilePath.split('/').pop();
} 