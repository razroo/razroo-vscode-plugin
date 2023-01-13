import { generateVsCodeDownloadCode } from './graphql/generate-code/generate-code.service';
import { getPathScaffolds } from './graphql/scaffold/scaffold.service';
import { getAuth0Url } from './utils/authentication/authentication';
import { URL_PROD_GRAPHQL, URL_GRAPHQL } from './graphql/awsConstants';
import AdmZip from 'adm-zip';
// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as request from 'request';
import * as http from 'http2';
import { onVSCodeClose, tryToAuth, updatePrivateDirectoriesInVSCodeAuthentication } from './utils/utils';
import {
  COMMAND_AUTH0_AUTH,
  MEMENTO_RAZROO_ACCESS_TOKEN,
  COMMAND_CANCEL_AUTH,
  GENERATE_ANGULAR_COMPONENT,
  GENERATE_ANGULAR_SERVICE,
  COMMUNITY,
  MEMENTO_RAZROO_ID_VS_CODE_TOKEN,
  MEMENTO_RAZROO_USER_ID,
  MEMENTO_RAZROO_ORG_ID,
  GENERATE_ANGULAR_GUARD,
  GENERATE_ANGULAR_TYPESCRIPT_INTERFACE,
  GENERATE_ANGULAR_PIPE,
  GENERATE_ANGULAR_DIRECTIVE,
} from './constants';
import { createDisposableAuthServer } from './auth/local';
import { Uri } from 'vscode';
import { getPackageJson, subscribeToGenerateVsCodeDownloadCodeSub } from './utils/graphql.utils';
import { EventEmitter } from 'stream';
import { isEmptyWorkspace } from './utils/directory.utils';
import { setWorkspaceState } from './utils/state.utils';
import { getOrCreateAndUpdateIdToken } from 'utils/token/token';
import { getNameFilePathFromFullPath, getNameFromFullPath } from 'common-utils/scaffold/scaffold.utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  console.debug('activate has been called');
  const showErrorMessage = vscode.window.showErrorMessage;
  const showInformationMessage = vscode.window.showInformationMessage;
  const showOpenDialog = vscode.window.showOpenDialog;
  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  const packageJsonParams = await getPackageJson(workspacePath as any);

  context.subscriptions.push(
    vscode.commands.registerCommand('getContext', () => context)
  );
  await tryToAuth(context);
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

  const authEventEmitter = new EventEmitter();
  const cancelAuthProgress = (progress: vscode.Progress<{
    message?: string | undefined;
    increment?: number | undefined;
  }>) => {
    progress.report({ increment: 100 });
    vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationInProgress', false);
  };

  const generateAngularComponent = vscode.commands.registerCommand(
    GENERATE_ANGULAR_COMPONENT,
    async ({path}) => createAngularScaffold(path, context, isProduction, 'component', packageJsonParams)
  );
  context.subscriptions.push(generateAngularComponent);
  const generateAngularService = vscode.commands.registerCommand(
    GENERATE_ANGULAR_SERVICE,
    async ({path}) => createAngularScaffold(path, context, isProduction, 'angular-service', packageJsonParams)
  );
  context.subscriptions.push(generateAngularService);
  const generateAngularPipe = vscode.commands.registerCommand(
    GENERATE_ANGULAR_PIPE,
    async ({path}) => createAngularScaffold(path, context, isProduction, 'angular-pipe', packageJsonParams)
  );
  context.subscriptions.push(generateAngularPipe);
  const generateAngularGuard = vscode.commands.registerCommand(
    GENERATE_ANGULAR_GUARD,
    async ({path}) => createAngularScaffold(path, context, isProduction, 'angular-guard', packageJsonParams)
  );
  context.subscriptions.push(generateAngularGuard);
  const generateAngularDirective = vscode.commands.registerCommand(
    GENERATE_ANGULAR_DIRECTIVE,
    async ({path}) => createAngularScaffold(path, context, isProduction, 'angular-directive', packageJsonParams)
  );
  context.subscriptions.push(generateAngularDirective);
  const generateAngularTypescriptInterface = vscode.commands.registerCommand(
    GENERATE_ANGULAR_TYPESCRIPT_INTERFACE,
    async ({path}) => createAngularScaffold(path, context, isProduction, 'typescript-interface', packageJsonParams)
  );
  context.subscriptions.push(generateAngularTypescriptInterface);

  const auth0Authentication = vscode.commands.registerCommand(
    COMMAND_AUTH0_AUTH,
    async () => {
      vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationInProgress', true);
      const token = await getOrCreateAndUpdateIdToken(context);
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
              isInProgress && await updatePrivateDirectoriesInVSCodeAuthentication(token!, accessToken, isProduction, userId, orgId);
              isInProgress && await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId: token, context });
              isInProgress && vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticated', true);
              isInProgress && showInformationMessage('User successfully authenticated with Razroo.');
            } catch (error) {
              showErrorMessage(error as any);
            } finally {
              vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:isAuthenticationCancelling', false);
              disposeServer(cancelAuthProgress, res, progress);
            }
          }).catch(async(err) => {
            await onVSCodeClose(context, cancelAuthProgress, progress);
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
      onVSCodeClose(context)?.finally(() => {
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

function createAngularScaffold(path, context, isProduction, scaffoldId, packageJsonParams){
  const orgId = COMMUNITY;
  const pathId = 'angular-15.0.0';
  const recipeId = 'angular-core';
  const nameFilePath = getNameFilePathFromFullPath(path);
  const name = getNameFromFullPath(path);
  
  const parameters = {
    nameFilePath: nameFilePath,
    name: name,
    projectName: packageJsonParams.name
  };

  const generateVsCodeDownloadCodeParameters = {
    projectName: packageJsonParams.name,
    parameters: JSON.stringify(parameters),
    pathOrgId: orgId,
    pathId: pathId,
    recipeId: recipeId,
    stepId: scaffoldId,
    vsCodeInstanceId: context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN) as string,
    userId: context.workspaceState.get(MEMENTO_RAZROO_USER_ID) as string,
    userOrgId: context.workspaceState.get(MEMENTO_RAZROO_ORG_ID) as string,
  };

  generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters, context, isProduction).then(data => {
    console.log('data');
    console.log(data);
  });
}
