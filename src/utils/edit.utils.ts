import * as vscode from 'vscode';
import { EditInput, morphCode, replaceTagParameters } from '@razroo/razroo-devkit';
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

export function editFiles(updates: string, parameters: any) {
    const workspaceFolders = getWorkspaceFolders();
    const getCurrentWorkspaceFolderPath = workspaceFolders ? workspaceFolders[0].path : '';
    const updatesParsed = JSON.parse(updates);

    updatesParsed.forEach((editInput: EditInput) => {
      const transformedFileName = replaceTagParameters(parameters, editInput.fileName);
      let newFile;
      if(editInput.filePath) {
        const filePathTransformed = replaceTagParameters(parameters, editInput.filePath);
        newFile = path.join(getCurrentWorkspaceFolderPath, filePathTransformed, transformedFileName);
      }
      else {
        newFile = path.join(getCurrentWorkspaceFolderPath, parameters.defaultFilePath, transformedFileName);
      }

      const fileToBeAddedTo = fs.readFileSync(newFile, 'utf-8').toString();

      writeEditedFile(editInput, fileToBeAddedTo, newFile, parameters);
    });
    
    showInformationMessage('Files have been edited. Lets goooo!!!');
}

function writeEditedFile(editInput: EditInput, fileToBeAddedTo: string, newFile: string, parameters: any) {
  // the fileToBeAddedTo needs to be manually added in.
  const updatedEditInput = {...editInput, fileToBeAddedTo};
        
  const convertedCode = morphCode(updatedEditInput);
  const replaceTagParametersCode = replaceTagParameters(parameters, convertedCode);

  fs.writeFile(newFile, replaceTagParametersCode, async(_) => {
    console.log(`${newFile} has been edited`);
  });
}