import { URL_PROD_GRAPHQL, URL_GRAPHQL } from './graphql/awsConstants.js';
import { v4 as uuidv4 } from 'uuid';
const AdmZip = require('adm-zip');
// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as request from 'request';
import * as http from 'http2';
import { getAuth0Url, onVSCodeClose, updatePrivateDirectoriesInVSCodeAuthentication } from './utils/utils.js';
import {
  COMMAND_AUTH0_AUTH,
  MEMENTO_RAZROO_ACCESS_TOKEN,
  MEMENTO_RAZROO_ID_TOKEN,
  MEMENTO_RAZROO_ID_VS_CODE_TOKEN,
  MEMENTO_RAZROO_REFRESH_TOKEN,
  MEMENTO_RAZROO_USER_ID,
} from './constants.js';
import { createDisposableAuthServer } from './auth/local.js';
import { Uri } from 'vscode';
import { subscribeToGenerateVsCodeDownloadCodeSub } from './utils/graphql.utils.js';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  console.log('this is called up top');
  const showErrorMessage = vscode.window.showErrorMessage;
  const showInformationMessage = vscode.window.showInformationMessage;
  const showOpenDialog = vscode.window.showOpenDialog;
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("extensionMode");
  console.log(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('getContext', () => context)
  );
  
  // 1 is production mode
  const isProduction = context.extensionMode === 1;
  let disposable = vscode.commands.registerCommand(
    'razroo-vscode-plugin.initialization',
    () => {
      vscode.window.showInformationMessage(
        'Thanks for using the Razroo VSCode Plugin. It will help you write production code easier and faster.'
      );
    }
  );

  context.subscriptions.push(disposable);

  const auth0Authentication = vscode.commands.registerCommand(
    COMMAND_AUTH0_AUTH,
    async () => {
      vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationInProgress', true);
      console.log('inside auth0Authentcation');

      let token: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
      if (!token) { 
        token = uuidv4();
        context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, token);
      }
      console.log('isProduction');
      console.log(isProduction);

      const loginUrl = getAuth0Url(isProduction);

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          cancellable: false,
          title: 'Authentication in Razroo',
        },
        async (progress) => {
          vscode.commands.executeCommand('vscode.open', Uri.parse(loginUrl)).then(() => {
            const { createServerPromise, dispose } = createDisposableAuthServer();
            createServerPromise
              .then(({ idToken, refreshToken, userId }) => {
                context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, idToken);
                context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, refreshToken);
                context.workspaceState.update(MEMENTO_RAZROO_USER_ID, userId);
                return { idToken, refreshToken, userId };
              })
              .then(({ idToken, userId }) => updatePrivateDirectoriesInVSCodeAuthentication(token!, idToken, isProduction, userId))
              .then(() => subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId: token, context }))
              .then(() => {
                vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
                return;
              })
              .then(() => {
                showInformationMessage('User successfully authenticated with Razroo.');
                return;
              })
              .catch(() => {
                showErrorMessage('Authentication error, please try again.')
                return;
              })
              .finally(() => {
                progress.report({ increment: 100 });
                vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationInProgress', false);
                dispose();
              });
          });
        }
      );
    }
  );

  const logout = vscode.commands.registerCommand(
    'extension.logout',
    () =>  { 
      onVSCodeClose(context)?.finally(() => {
        vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', false);
      });
    }
  );
  context.subscriptions.push(auth0Authentication);
  context.subscriptions.push(logout);

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

  vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:activated', true);
}

// this method is called when your extension is deactivated
export async function deactivate() {
  vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:activated', false);
  const context = await vscode.commands.executeCommand('getContext') as vscode.ExtensionContext;
  await onVSCodeClose(context);
};
