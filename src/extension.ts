import { URL_PROD_GRAPHQL, URL_GRAPHQL } from './graphql/awsConstants';
// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import open = require('open');
import { v4 as uuidv4 } from 'uuid';
import * as AdmZip from 'adm-zip';
import * as request from 'request';
import * as http from 'http2';
import { existVSCodeAuthenticate, getAuth0Url } from './utils/utils';
import {
  COMMAND_AUTH0_AUTH,
  MEMENTO_RAZROO_ACCESS_TOKEN,
  MEMENTO_RAZROO_ID_VS_CODE_TOKEN,
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
  
  // 1 is production mode
  let isProduction = context.extensionMode === 1;
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

  const auth0Authentication = vscode.commands.registerCommand(
    COMMAND_AUTH0_AUTH,
    async () => {
      console.log('inside auth0Authentcation');

      const token = uuidv4();
      context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, token);
      const loginUrl = getAuth0Url(token, isProduction);

      await open(loginUrl);

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          cancellable: false,
          title: 'Authentication in Razroo',
        },
        async (progress) => {
          progress.report({ increment: 0 });

          const { error } = await existVSCodeAuthenticate(context);

          progress.report({ increment: 100 });
          if (error) {
            showErrorMessage('Authentication error, please try again.');
          } else {
            showInformationMessage(
              'User successfully authenticated with Razroo.'
            );
          }
        }
      );
    }
  );
  context.subscriptions.push(auth0Authentication);

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

      const url = isProduction === true ? URL_PROD_GRAPHQL : URL_GRAPHQL;
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
