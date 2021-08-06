// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import open = require('open');
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import * as AdmZip from 'adm-zip';
import * as request from 'request';
import * as http from 'http2';

import { getAuth0Url } from './utils';
import { AUTH0URL, COMMAND_AUTH0_AUTH, DEVAUTHURL, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_ID_TOKEN, MEMENTO_RAZROO_LOGIN_SOCKET_CHANNEL, MEMENTO_RAZROO_REFRESH_TOKEN, SOCKET_HOST } from './constants';


const showErrorMessage = vscode.window.showErrorMessage;
const showInformationMessage = vscode.window.showInformationMessage;
const showOpenDialog = vscode.window.showOpenDialog;

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

  const auth0Authentication = vscode.commands.registerCommand(COMMAND_AUTH0_AUTH,
    async () => {
      console.log("inside auth0Authentcation");
      //Auth0 Authentication
      // const githubEmail = await vscode.window.showInputBox({ title: "Your GitHub Email", placeHolder: "Your Github email", prompt: "Please type in your Github email", validateInput: (value) => validateEmail(value) });
      // console.log("githubEmail", githubEmail);
      const token =  uuidv4();
      const host = SOCKET_HOST;
      const loginUrl = getAuth0Url(token, host);

      const httpServer = createServer();      
      const io = new Server(httpServer, {
          cors: {
              origin: [DEVAUTHURL, AUTH0URL],
              methods: ["GET", "POST"]
          }
      });

      io.on("connection", (socket: Socket) => {
          socket.on(token, (msg) => {
            const [refresh_token, id_token, access_token] = msg;
            console.log('User is authenticated via web.');
            context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, refresh_token);
            context.workspaceState.update(MEMENTO_RAZROO_ACCESS_TOKEN, access_token);
            context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, id_token);
            context.workspaceState.update(MEMENTO_RAZROO_LOGIN_SOCKET_CHANNEL, token);
          });
      });
      httpServer.listen(3000);

      await open(loginUrl);


    });
  context.subscriptions.push(auth0Authentication);

  const getGenerateCode = vscode.commands.registerCommand('extension.getGenerateCode', async () => {
    // get token
    const token = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
    console.log("Token: ", token);
    if ( !token ) {
      console.error('Token is null');
      showErrorMessage("Session has expired. Please login again.");
      vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
      return;
    }
    // generate prompt
    const templateId = await vscode.window.showInputBox({ title: "Your templateId", placeHolder: "Your templateId", prompt: "Please type in the templateId" });
    console.log('templateId: '+templateId);
    
    const url = 'https://vuerbsj4cjffvfzx7cph4iy7se.appsync-api.us-east-1.amazonaws.com/graphql';
    const body = {
      "query": `query generateCode{\r\n      generateCode(generateCodeParameters: {templateId: \"${templateId}\"}) {\r\n    template {\r\n      author\r\n      description\r\n      id\r\n      lastUpdated\r\n      name\r\n      parameters\r\n      stepper\r\n      type\r\n    }\r\n    downloadUrl\r\n    parameters\r\n  }\r\n}`,
      "variables": {}
    };
    request.post( { url, body: JSON.stringify(body),
      headers: {
        Authorization: token,
        "Content-Type": "application/json"
      },
      gzip: true
    }, async (error, response, body) => {
        // console.log("error: ",error);
        if ( response.statusCode === http.constants.HTTP_STATUS_FORBIDDEN || response.statusCode === http.constants.HTTP_STATUS_UNAUTHORIZED ) {
          showErrorMessage("Session has expired. Please login again.");
          vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
          return;
        }
        if ( error ) {
          await showErrorMessage("Something went wrong. Please contact support.");
          return;
        }
        
        // console.log("Response: ", response);
        // console.log("Body: ", body);

        const bodyObject = JSON.parse(body);

        request.get({url: bodyObject.data.generateCode.downloadUrl , encoding: null}, async (err, res, body) => {
          var zip = new AdmZip(body);
          showOpenDialog({canSelectFiles: false, canSelectFolders: true , canSelectMany: false}).then((value: vscode.Uri[] | undefined) => {
            if ( !value ) {
              // console.log("User did not select a folder");
              showInformationMessage("Please select a folder");
              return;
            }
            const dir = value[0];
            try {
              // console.log("Dir: ", dir.fsPath);
              zip.extractAllTo(dir.fsPath, false);  
            }catch(error){
              // let the user know that the download faile, check folder permission, or ask support.
              showErrorMessage("We had problems writting in that folder, please check for permissions");
            }
          });
        });
    });
  });
  context.subscriptions.push(getGenerateCode);
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
