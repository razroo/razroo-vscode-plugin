import { getAuth0Url } from './utils/authentication/authentication';
import AdmZip from 'adm-zip';
// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as request from 'request';
import * as http from 'http2';
import { onVSCodeClose, tryToAuth, updatePrivateDirectoriesInVSCodeAuthentication } from './utils/utils';
import { URL_PROD_GRAPHQL, URL_GRAPHQL } from './graphql/awsConstants';
import {
  COMMAND_AUTH0_AUTH,
  MEMENTO_RAZROO_ACCESS_TOKEN,
  COMMAND_CANCEL_AUTH
} from './constants';
import { createDisposableAuthServer } from './auth/local';
import { Uri } from 'vscode';
import { getPackageJson, subscribeToGenerateVsCodeDownloadCodeSub } from './utils/graphql.utils';
import { EventEmitter } from 'stream';
import { setWorkspaceState } from './utils/state.utils';
import { getOrCreateAndUpdateIdToken } from './utils/token/token';
import { pushScaffoldCommands } from './utils/scaffold/push-scaffold-commands';
import { determineLanguagesUsed, searchForPackageJson, readPackageJson } from 'package-json-manager';
import { PackageJson, PackageTreeNode } from 'package-json-manager/dist/core/package-json';
import { dirname } from 'path';
import { logCursorPosition } from './snippets/log-position';
import {debounce} from 'lodash';
const path = require('path');

// function to determine if production environment or not
function isProductionFunc(context: vscode.ExtensionContext): boolean {
  // 1 is production mode
  // Use this if have access to razroo-frontend and uncomment line below
  // return context.extensionMode === 1;
  // Open source members use this
  return true;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  console.debug('activate has been called');
  const showErrorMessage = vscode.window.showErrorMessage;
  const showInformationMessage = vscode.window.showInformationMessage;
  const showOpenDialog = vscode.window.showOpenDialog;
  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  const packageJsonParams = await getPackageJson(workspacePath as any);

  const packageJsonPath = searchForPackageJson(workspacePath as any);
  getProjectDependencies(packageJsonPath as any).then((jsonMap)=>{
    determineLanguagesUsed(jsonMap).then(async (languagesUsed) => {
      languagesUsed.forEach(languageUsed => {
        vscode.commands.executeCommand('setContext', `razroo-vscode-plugin-language:${languageUsed}`, true);
      });
    });
  }).catch((err)=>{
    console.log(err);
  });
  context.subscriptions.push(
    vscode.commands.registerCommand('getContext', () => context)
  );
  // 1 is production mode
  // Use this if have access to razroo-frontend and uncomment line below
  // const isProduction = context.extensionMode === 1;
  // Open source members use this
  const isProduction = isProductionFunc(context);
  await tryToAuth(context, isProduction);
  let disposable = vscode.commands.registerCommand(
    'razroo-vscode-plugin.initialization',
    () => {
      vscode.window.showInformationMessage(
        'Thanks for using the Razroo VSCode Plugin. It will help you write production code easier and faster.'
      );
    }
  );

  let activeEditor = vscode.window.activeTextEditor;
  let debouncedSnippetRequest;
  vscode.workspace.onDidChangeTextDocument(event => {
    if (activeEditor && event.document === activeEditor.document) {
      if(debouncedSnippetRequest) {
        debouncedSnippetRequest.cancel();
      }
      debouncedSnippetRequest = debounce(() => {
        logCursorPosition(context, (activeEditor as any).selection, isProduction);
      }, 300);
      debouncedSnippetRequest();
    }
  }, null, context.subscriptions);

  context.subscriptions.push(disposable);

  const authEventEmitter = new EventEmitter();
  const cancelAuthProgress = (progress: vscode.Progress<{
    message?: string | undefined;
    increment?: number | undefined;
  }>) => {
    progress.report({ increment: 100 });
    vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationInProgress', false);
  };

  pushScaffoldCommands(context, vscode, isProduction, packageJsonParams);

  const auth0Authentication = vscode.commands.registerCommand(
    COMMAND_AUTH0_AUTH,
    async () => {
      vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationInProgress', true);
      const loginUrl = getAuth0Url(isProduction);

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          cancellable: false,
          title: 'Authentication in Razroo',
        },
        async (progress) => {
          new Promise(async (res, rej) => {
            let isInProgress = true;
            authEventEmitter.on('cancel', () => {
              isInProgress = false;
              vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationCancelling', true);
              rej('Authentication canceled');
            });
            let disposeServer = (cancelAuthProgress, res, progress) => { };
            try {
              isInProgress && await vscode.commands.executeCommand('vscode.open', Uri.parse(loginUrl));
              const { createServerPromise, disposeAndCancelAuth } = createDisposableAuthServer();
              disposeServer = disposeAndCancelAuth;
              const { accessToken = '', refreshToken = '', userId = '', orgId = '' } = isInProgress ? await createServerPromise : {};
              setWorkspaceState(context, accessToken, refreshToken, userId, orgId, isInProgress);
              const vsCodeInstanceId = await getOrCreateAndUpdateIdToken(context, userId);
              if(vsCodeInstanceId === 'no-git-found') {
                showInformationMessage('Please initialize a git repo to get started');
              }
              else {
                isInProgress && await updatePrivateDirectoriesInVSCodeAuthentication(vsCodeInstanceId!, accessToken, isProduction, userId, orgId);
                isInProgress && await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId: vsCodeInstanceId, context, isProduction });
                isInProgress && vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
                isInProgress && showInformationMessage('User successfully authenticated with Razroo.');
              }
            } catch (error) {
              showErrorMessage(error as any);
            } finally {
              vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationCancelling', false);
              disposeServer(cancelAuthProgress, res, progress);
            }
          }).catch(async(err) => {
            await onVSCodeClose(context, isProduction, cancelAuthProgress, progress);
            await showInformationMessage(err);
          });
        }
      );
    }
  );

  const cancelAuthentication = vscode.commands.registerCommand(
    COMMAND_CANCEL_AUTH,
    async () => {
      authEventEmitter.emit('cancel');
    });

  const logout = vscode.commands.registerCommand(
    'extension.logout',
    () => {
      onVSCodeClose(context, isProduction)?.finally(() => {
        showInformationMessage('Successfully Logged Out Of Razroo');
        vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', false);
      });
    }
  );
  context.subscriptions.push(auth0Authentication);
  context.subscriptions.push(cancelAuthentication);
  context.subscriptions.push(logout);

  const getGenerateCode = vscode.commands.registerCommand(
    'extension.getGenerateCode',
    async () => {
      // get token
      const token = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
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
  const context = await vscode.commands.executeCommand('getContext') as vscode.ExtensionContext;
  const isProduction = isProductionFunc(context);
  vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:activated', false);
  await onVSCodeClose(context, isProduction);
};

async function getProjectDependencies(dir: string): Promise<Map<string, PackageTreeNode>> {
  const pkg = await readPackageJson(path.join(dir, 'package.json'));
  if (!pkg) {
    throw new Error('Could not find package.json');
  }

  const results = new Map<string, PackageTreeNode>();
  for (const [name, version] of getAllDependencies(pkg)) {
    const packageJsonPath = searchForPackageJson(dir);
    if (!packageJsonPath) {
      continue;
    }

    results.set(name, {
      name,
      version,
      path: dirname(packageJsonPath),
      package: await readPackageJson(packageJsonPath),
    });
  }

  return results;
}

function getAllDependencies(pkg: PackageJson): Set<[string, string]> {
  return new Set([
    ...Object.entries(pkg.dependencies || []),
    ...Object.entries(pkg.devDependencies || []),
    ...Object.entries(pkg.peerDependencies || []),
    ...Object.entries(pkg.optionalDependencies || []),
  ]);
}