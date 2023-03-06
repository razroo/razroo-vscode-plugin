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