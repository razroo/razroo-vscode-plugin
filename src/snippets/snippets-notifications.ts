import { DEV_APP_URL, PROD_APP_URL } from '../constants';
import * as vscode from 'vscode';

export function codeSnippetGeneratingNotification() {
  const cancelAction = {
    title: "Cancel",
    action: () => {
      console.log("Cancel snippet generating clicked");
    }
  };

  vscode.window.showInformationMessage("Code Snippet generating...", cancelAction).then(selectedAction => {
    if (selectedAction === cancelAction) {
      console.log("Cancel button clicked");
    }
  });
}

export function codeSnippetGeneratedNotification(isProduction: boolean, orgId: string, pathId: string, recipeId: string, id: string) {
  const razrooStepURL = `${isProduction ? PROD_APP_URL : DEV_APP_URL}/${orgId}/${pathId}/${recipeId}/${id}`;
  const openLinkCommand = {
    title: 'Open in Razroo',
    command: 'extension.openLink'
  };
  vscode.window.showInformationMessage(razrooStepURL,openLinkCommand).then(selection=>{
    if(selection && selection.command === 'extension.openLink') {
      vscode.env.openExternal(vscode.Uri.parse(`${razrooStepURL}`));
    };
  });
}