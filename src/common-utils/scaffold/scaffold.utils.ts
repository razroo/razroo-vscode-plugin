import * as vscode from 'vscode';

// TODO - see if windows works - normalization of url
export function getNameFilePathFromFullPath(workspaceFolder, fullFilePath: string) {
  const rootDirectory = workspaceFolder ? workspaceFolder.uri.path : '';
  return fullFilePath.replace(rootDirectory + '/', '');
}

// TODO - see if windows works - normalization of url
export function getNameFromFullPath(fullFilePath: string) {
  return fullFilePath.split('/').pop();
} 