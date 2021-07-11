// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fileSystem = require('fs');
import path = require('path');
import createAuth0Client from '@auth0/auth0-spa-js';
import { Credentials } from './credentials';
import { validateEmail } from './utils';
import open = require('open');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "razroo-vscode-plugin" is now active!'
  );
  console.log(__dirname);
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'razroo-vscode-plugin.initialization',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      console.log('DirName', __dirname);
      console.log('FileName', __filename);
      vscode.window.showInformationMessage(
        'Thanks for using the Razroo VSCode Plugin. It will help you write production code easier and faster.'
      );
    }
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand('razroo-vscode-plugin.authenticateViaWebview', () => {
      // Create and show a new webview

      const panel = vscode.window.createWebviewPanel(
        'catCoding', // Identifies the type of the webview. Used internally
        'Razroo Authentication', // Title of the panel displayed to the user
        vscode.ViewColumn.Active, // Editor column to show the new webview panel in.
        {
          // Enable scripts in the webview
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent();
    })
  );

  // GitHub Authentication
  const githubDisposable = vscode.commands.registerCommand(
    'extension.getGitHubUser',
    async () => {

      /**
       * Octokit (https://github.com/octokit/rest.js#readme) is a library for making REST API
       * calls to GitHub. It provides convenient typings that can be helpful for using the API.
       *
       * Documentation on GitHub's REST API can be found here: https://docs.github.com/en/rest
       */
      //const octokit = await credentials.getOctokit();
      //console.log("octokit", octokit);
      //const userInfo = await octokit.users.getAuthenticated();
      //console.log("userInfo", userInfo);

      //vscode.window.showInformationMessage(
      //  `Logged into GitHub as ${userInfo.data.login}`
      //);
    }
  );
  context.subscriptions.push(githubDisposable);

  const auth0Authentication = vscode.commands.registerCommand('extension.auth0Authentication',
    async () => {
      console.log("inside auth0Authentcation");
      //Auth0 Authentication
      const githubEmail = await vscode.window.showInputBox({ title: "Your GitHub Email", placeHolder: "Your Github email", prompt: "Please type in your Github email", validateInput: (value) => validateEmail(value) });
      console.log("githubEmail", githubEmail);
      const githubPassword = await vscode.window.showInputBox({ title: "Your GitHub Password", placeHolder: "Your Github Password", password: true });
      console.log("githubPassword", githubPassword);
      //await open("https://zeta.razroo.com");
    });
  context.subscriptions.push(auth0Authentication);
}

function getWebviewContent() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
  </head>
  <body>
  <button id="login">Click to Login</button>
  </iframe>
  </body>
  </html>`;
}

// this method is called when your extension is deactivated
export function deactivate() { }
