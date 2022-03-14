import * as vscode from 'vscode';
import { EditInput, morphCode } from '@razroo/razroo-devkit';
import * as path from 'path';
import * as fs from 'fs';

const showInformationMessage = vscode.window.showInformationMessage;

// doubling function for now. Having problems with the build
function getWorkspaceFolders() {
  console.log("VSCODE WORKSPACE FOLDERS: ", vscode.workspace?.workspaceFolders);
  return vscode.workspace?.workspaceFolders?.map((folder) => {
    return { name: folder.name, path: folder?.uri?.fsPath };
  });
};

export function editFiles(updates: string, file, parameters) {
    const workspaceFolders = getWorkspaceFolders();
    const getCurrentWorkspaceFolderPath = workspaceFolders ? workspaceFolders[0].path : '';
    const updatesParsed = JSON.parse(updates);
    const parametersParsed = JSON.parse(parameters);

    updatesParsed.forEach((editInput: EditInput) => {
      // TODO Change the parameter for newPath over to path
      const newFile = path.join(getCurrentWorkspaceFolderPath, parametersParsed.newPath, path.basename(file));
      const fileToBeAddedToPath = newFile.replace(/\.[^.]+$/, `.${editInput.fileType}`);
      const fileToBeAddedTo = fs.readFileSync(fileToBeAddedToPath, 'utf-8').toString();
      
      // the fileToBeAddedTo needs to be manually added in.
      const updatedEditInput = {...editInput, fileToBeAddedTo};
      
      const convertedCode = morphCode(updatedEditInput);

      fs.writeFile(fileToBeAddedToPath, convertedCode, async(_) => {
        console.log(`${fileToBeAddedToPath} has been edited`);
      });
    });
    
    showInformationMessage('Files have been edited. Lets goooo!!!');
}