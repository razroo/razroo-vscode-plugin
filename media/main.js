//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  //@ts-ignore
  const vscode = acquireVsCodeApi();
  //@ts-ignore
  document.querySelector('.Projects__connect-projects-button').addEventListener('click', () => {
    connectProjects();
  });

  function connectProjects() {
    console.log('connect projects called');
  }
  console.log('web view initialized');
}());