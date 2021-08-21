// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import open = require('open');
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import * as AdmZip from 'adm-zip';
import * as request from 'request';
import * as http from 'http2';
import gql from 'graphql-tag';
import client from './graphql/subscription';

import { existVSCodeAuthenticate, getAuth0Url } from './utils';
import {
  AUTH0URL,
  COMMAND_AUTH0_AUTH,
  DEVAUTHURL,
  MEMENTO_RAZROO_ACCESS_TOKEN,
  MEMENTO_RAZROO_ID_TOKEN,
  MEMENTO_RAZROO_LOGIN_SOCKET_CHANNEL,
  MEMENTO_RAZROO_REFRESH_TOKEN,
  SOCKET_HOST,
} from './constants';

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

  const subquery = gql(`
subscription MySubscription {
    generateCodeDownloadSub(vsCodeToken: "12345") {
      vsCodeToken
      downloadUrl
      parameters
    }
  }
`);

  client.hydrated().then(function (client) {
    //Now subscribe to results
    const observable = client.subscribe({ query: subquery });

    const realtimeResults = function realtimeResults(data: any) {
      console.log('realtime data: ', data);
    };

    observable.subscribe({
      next: realtimeResults,
      complete: console.log,
      error: console.log,
    });
  });

  const auth0Authentication = vscode.commands.registerCommand(
    COMMAND_AUTH0_AUTH,
    async () => {
      console.log('inside auth0Authentcation');
      //Auth0 Authentication
      // const githubEmail = await vscode.window.showInputBox({ title: "Your GitHub Email", placeHolder: "Your Github email", prompt: "Please type in your Github email", validateInput: (value) => validateEmail(value) });
      // console.log("githubEmail", githubEmail);
      const token = uuidv4();
      const host = SOCKET_HOST;
      const loginUrl = getAuth0Url(token, host);

      const httpServer = createServer();
      const io = new Server(httpServer, {
        cors: {
          origin: [DEVAUTHURL, AUTH0URL],
          methods: ['GET', 'POST'],
        },
      });

      io.on('connection', (socket: Socket) => {
        socket.on(token, (msg) => {
          const [refresh_token, id_token, access_token] = msg;
          showInformationMessage('User is authenticated via web.');
          context.workspaceState.update(
            MEMENTO_RAZROO_REFRESH_TOKEN,
            refresh_token
          );
          context.workspaceState.update(
            MEMENTO_RAZROO_ACCESS_TOKEN,
            access_token
          );
          context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, id_token);
          context.workspaceState.update(
            MEMENTO_RAZROO_LOGIN_SOCKET_CHANNEL,
            token
          );
        });
      });
      httpServer.listen(3000);

      await open(loginUrl);
    }
  );
  context.subscriptions.push(auth0Authentication);

  const NewAuth0Authentication = vscode.commands.registerCommand(
    'extension.NewAuth0Authentication',
    async () => {
      console.log('inside auth0Authentcation');

      const token = uuidv4();
      const host = SOCKET_HOST;
      const loginUrl = getAuth0Url(token, host);

      const httpServer = createServer();
      const io = new Server(httpServer, {
        cors: {
          origin: [DEVAUTHURL, AUTH0URL],
          methods: ['GET', 'POST'],
        },
      });

      io.on('connection', (socket: Socket) => {
        socket.on(token, (msg) => {
          const [refresh_token, id_token, access_token] = msg;
          showInformationMessage('User is authenticated via web.');
          console.log('refresh_token', refresh_token);
          console.log('id_token', id_token);
          console.log('access_token', access_token);
          context.workspaceState.update(
            MEMENTO_RAZROO_REFRESH_TOKEN,
            refresh_token
          );
          context.workspaceState.update(
            MEMENTO_RAZROO_ACCESS_TOKEN,
            access_token
          );
          context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, id_token);
          context.workspaceState.update(
            MEMENTO_RAZROO_LOGIN_SOCKET_CHANNEL,
            token
          );
        });
      });
      httpServer.listen(3000);

      await open(loginUrl);

      // await existVSCodeAuthenticate(token);
    }
  );

  context.subscriptions.push(NewAuth0Authentication);

  const getGenerateCode = vscode.commands.registerCommand(
    'extension.getGenerateCode',
    async () => {
      // get token
      const token = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
      console.log('Token: ', token);
      if (!token) {
        console.error('Token is null');
        showErrorMessage('Session has expired. Please login again.');
        vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
        return;
      }
      // generate prompt
      const templateId = await vscode.window.showInputBox({
        title: 'Your templateId',
        placeHolder: 'Your templateId',
        prompt: 'Please type in the templateId',
      });
      console.log('templateId: ' + templateId);

      const url =
        'https://vuerbsj4cjffvfzx7cph4iy7se.appsync-api.us-east-1.amazonaws.com/graphql';
      const body = {
        query: `query generateCode{\r\n      generateCode(generateCodeParameters: {templateId: \"${templateId}\"}) {\r\n    template {\r\n      author\r\n      description\r\n      id\r\n      lastUpdated\r\n      name\r\n      parameters\r\n      stepper\r\n      type\r\n    }\r\n    downloadUrl\r\n    parameters\r\n  }\r\n}`,
        variables: {},
      };
      request.post(
        {
          url,
          body: JSON.stringify(body),
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
          gzip: true,
        },
        async (error, response, body) => {
          // console.log("error: ",error);
          if (
            response.statusCode === http.constants.HTTP_STATUS_FORBIDDEN ||
            response.statusCode === http.constants.HTTP_STATUS_UNAUTHORIZED
          ) {
            showErrorMessage('Session has expired. Please login again.');
            vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
            return;
          }
          if (error) {
            await showErrorMessage(
              'Something went wrong. Please contact support.'
            );
            return;
          }

          // console.log("Response: ", response);
          // console.log("Body: ", body);

          const bodyObject = JSON.parse(body);

          request.get(
            { url: bodyObject.data.generateCode.downloadUrl, encoding: null },
            async (err, res, body) => {
              var zip = new AdmZip(body);
              const defaultUri = vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0].uri
                : null;

              let options = defaultUri
                ? {
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri,
                  }
                : {
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                  };

              showOpenDialog(options).then(
                (value: vscode.Uri[] | undefined) => {
                  if (!value) {
                    // console.log("User did not select a folder");
                    showInformationMessage('Please select a folder');
                    return;
                  }
                  const dir = value[0];
                  try {
                    // console.log("Dir: ", dir.fsPath);
                    zip.extractAllTo(dir.fsPath, false);
                  } catch (error) {
                    // let the user know that the download faile, check folder permission, or ask support.
                    showErrorMessage(
                      'We had problems writting in that folder, please check for permissions'
                    );
                  }
                }
              );
            }
          );
        }
      );
    }
  );
  context.subscriptions.push(getGenerateCode);
}

// this method is called when your extension is deactivated
export function deactivate() {}
