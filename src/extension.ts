import AdmZip from "adm-zip";
// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as request from 'request';
import * as http from 'http2';
import { onVSCodeClose, tryToAuth } from './utils/utils';
import { URL_PROD_GRAPHQL, URL_GRAPHQL } from './graphql/awsConstants';
import {
  COMMAND_AUTH0_AUTH,
  MEMENTO_RAZROO_ACCESS_TOKEN,
  COMMAND_CANCEL_AUTH,
  COMMAND_TRY_TO_AUTH,
  MEMENTO_SELECTED_PROJECTS,
  ACTIVE_WORKSPACE_FOLDER_PROJECT_CONFIG,
  COMMAND_CONNECT_PROJECTS_TRY_TO_AUTH,
  COMMAND_LOG_OUT_USER,
  RAZROO_PREVIEW_STATE,
  MEMENTO_RAZROO_ORG_ID,
  COMMAND_CREATE_PROJECT,
  EMPTY
} from './constants';
import { EventEmitter } from 'stream';
import { pushScaffoldCommands } from './utils/scaffold/push-scaffold-commands';
import { logCursorPosition } from './snippets/log-position';
import {debounce} from 'lodash';
import { ProjectsWebview } from './projects/projects';
import { updateVsCode } from './update-vscode/update-vscode';
import { getProjectConfigs } from './projects/project-configs';
import { getWorkspaceFolders } from './utils/directory.utils';
import { ProjectConfig, VersionControlParams } from './projects/interfaces/project-config.interfaces';
import { determineLanguagesUsed } from './scaffolds/determine-languages-used';
import { getAuth0LogoutUrl } from './utils/authentication/authentication';
import { resetWorkspaceState } from './utils/state.utils';
import { generatePreviewFiles } from './preview/generate-preview';
import { PreviewStateObject } from './preview/preview.interface';
import { createVSCodeIdToken } from "./utils/token/token";
import { MEMENTO_RAZROO_USER_ID, MEMENTO_RAZROO_REFRESH_TOKEN } from "./constants";
import { getAccessToken } from "./auth/auth";
import { disconnectVsCodeInstance } from "./disconnect/disconnect.service";
import { generateVsCodeDownloadCode } from "./graphql/generate-code/generate-code.service";
import { saveFiles } from "./utils/utils";
import { createPathForStarterRepo } from "./starters/starter-utils";

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
  const projectsProvider = new ProjectsWebview(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ProjectsWebview.viewType,
      projectsProvider
    )
  );

  const showErrorMessage = vscode.window.showErrorMessage;
  const showInformationMessage = vscode.window.showInformationMessage;
  const showOpenDialog = vscode.window.showOpenDialog;
  
  const workspaceFolders = getWorkspaceFolders();
  
  const isProduction = isProductionFunc(context);
  let projectConfigs: ProjectConfig[] = [];
  if(workspaceFolders) {
    for(let workspaceFolder of workspaceFolders) {
      const individualProjectConfig = await getProjectConfigs(workspaceFolder.path);
      let packageJsonParams = undefined;
      if(individualProjectConfig) {
        packageJsonParams = individualProjectConfig.packageJsonParams;  
      }
      const workspaceFolderName = workspaceFolder.name;
      // use workspace folder name, to create state for project config
      // will allow active state for that workspace folder to be pulled up
      // whenever user is inside of that folder
      if(packageJsonParams) {
        await determineLanguagesUsed(packageJsonParams).then(async(languagesUsed) => {
          languagesUsed.forEach(languageUsed => {
            vscode.commands.executeCommand('setContext', `razroo-vscode-plugin-language:${languageUsed}`, true);
          });
        });
      }

      context.workspaceState.update(workspaceFolderName, individualProjectConfig);
      if(individualProjectConfig) {
        console.log('individualProjectConfig');
        console.log(individualProjectConfig);
        projectConfigs.push(individualProjectConfig);
      }
    }
  }

  pushScaffoldCommands(context, vscode, isProduction);
  
  context.subscriptions.push(
    vscode.commands.registerCommand('getContext', () => context)
  );
  // 1 is production mode
  // Use this if have access to razroo-frontend and uncomment line below
  // const isProduction = context.extensionMode === 1;
  // Open source members use this
  
  let debouncedSnippetRequest;
  vscode.workspace.onDidChangeTextDocument(event => {
    let activeEditor = vscode.window.activeTextEditor;
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

  // event used to determine workspace user is in
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if(editor) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      if (workspaceFolder) {
        const workspaceFolderName = workspaceFolder.name;
        const workspaceState = context.workspaceState.get(workspaceFolderName);
        context.workspaceState.update(ACTIVE_WORKSPACE_FOLDER_PROJECT_CONFIG, workspaceState);
      }
    }
  });

  const authEventEmitter = new EventEmitter();

  const auth0Authentication = vscode.commands.registerCommand(
    COMMAND_AUTH0_AUTH,
    async ({selectedProjects, projectConfigs}) => {
      context.workspaceState.update(MEMENTO_SELECTED_PROJECTS, selectedProjects);
      const selectedProjectsArr: ProjectConfig[] = selectedProjects ? selectedProjects : [];
      await updateVsCode(context, isProduction, selectedProjectsArr, projectsProvider);
    }
  );

  const tryToAuthCommmand = vscode.commands.registerCommand(
    COMMAND_TRY_TO_AUTH,
    async() => {
      try {
        await tryToAuth(context, isProduction, projectsProvider, projectConfigs);
      } catch (error) {
        console.log('COMMAND_TRY_TO_AUTH ERROR');
        console.error(error);
      }
    }
  );

  const createProject = vscode.commands.registerCommand(
    COMMAND_CREATE_PROJECT,
    async({path, projectName}) => {
      const parameters = {
        name: projectName,
        infrastructureCommandPath: '.'
      };
      const userId = await context.globalState.get(MEMENTO_RAZROO_USER_ID) as string;
      const userOrgId = context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string;
      const generateVsCodeDownloadCodeParameters = {
        pathId: path.pathId,
        recipeId: path.recipeId,
        stepId: path.stepId,
        projectName: EMPTY,
        pathOrgId: path.orgId,
        userId: userId,
        userOrgId: userOrgId,
        vsCodeInstanceId: `${userId}-${userOrgId}`,
        parameters: JSON.stringify(parameters)
      };
      try {
        const result = await generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters, context, isProduction);
        const starterFolderPath = createPathForStarterRepo(context, projectName);
        const data = result?.data?.generateVsCodeDownloadCode;
        await saveFiles(data, context, isProduction, starterFolderPath);
      } catch (error) {
        console.log('COMMAND_CREATE_PROJECT');
        console.error(error);
      }
    }
  );

  const connectProjectsTryToAuthCommmand = vscode.commands.registerCommand(
    COMMAND_CONNECT_PROJECTS_TRY_TO_AUTH,
    async({selectedProjects, disconnectedProjects, orgId}) => {
      try {
        context.workspaceState.update(MEMENTO_SELECTED_PROJECTS, selectedProjects);
        
        // disconnects projects before they are connected
        if(disconnectedProjects && disconnectedProjects.length) {
          for(let disconnectedProject of disconnectedProjects) {
            const userId = await context.globalState.get(MEMENTO_RAZROO_USER_ID) as string;
            const userOrgId = context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string;
            const accessToken = await getAccessToken(context, isProduction);
            const vsCodeInstanceId = createVSCodeIdToken(userId, userOrgId, disconnectedProject.versionControlParams, disconnectedProject.packageJsonParams, disconnectedProject.folderName);
            await disconnectVsCodeInstance(accessToken, userId, vsCodeInstanceId, isProduction);
          }
          if(!selectedProjects && !selectedProjects.length) {
            // there are selected projects so event emitter will happen here
            await projectsProvider?.view?.webview.postMessage({
              command: "projectsDisconnected",
              selectedProjects
            });
          }
        }
        await tryToAuth(context, isProduction, projectsProvider, projectConfigs, orgId);
      } catch (error) {
        console.log('Connect projects try to auth ERROR');
        console.error(error);
      }
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
        showInformationMessage('Un-Connected From Razroo');
        projectsProvider?.view?.webview.postMessage({
          command: "loggedOut"
        });
      });
    }
  );

  const logoutUser = vscode.commands.registerCommand(
    COMMAND_LOG_OUT_USER,
    async () => {
      const logoutUrl = getAuth0LogoutUrl(isProduction);
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(logoutUrl));
      resetWorkspaceState(context);
    }
  );

  // Code to build preview and upload
  let buildPreviewAndUploadDisposable = vscode.commands.registerCommand('extension.buildPreviewAndUpload', async() => {
    const projectConfig = context.workspaceState.get(ACTIVE_WORKSPACE_FOLDER_PROJECT_CONFIG) as any;
    const workspaceFolder = projectConfig?.versionControlParams?.path;
    const previewStateObject = await context.workspaceState.get(RAZROO_PREVIEW_STATE) as PreviewStateObject;
    const accessToken = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN) as string;
    const userOrgId = context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string;
    await generatePreviewFiles(workspaceFolder, accessToken, isProduction, previewStateObject, userOrgId);
  });

  context.subscriptions.push(tryToAuthCommmand);
  context.subscriptions.push(connectProjectsTryToAuthCommmand);
  context.subscriptions.push(auth0Authentication);
  context.subscriptions.push(cancelAuthentication);
  context.subscriptions.push(logout);
  context.subscriptions.push(logoutUser);
  context.subscriptions.push(buildPreviewAndUploadDisposable);


  // execute command for tryToAuth to re-connect previously connected projects
  const selectedProjects = context.workspaceState.get(MEMENTO_SELECTED_PROJECTS);
  if(selectedProjects) {
    vscode.commands.executeCommand(COMMAND_TRY_TO_AUTH);
  }

  const getGenerateCode = vscode.commands.registerCommand(
    'extension.getGenerateCode',
    async () => {
      // get token
      const token = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
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
  const userId = await context.globalState.get(MEMENTO_RAZROO_USER_ID) as string;
  const userOrgId = context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string;
  const selectedProjects = await context.workspaceState.get(MEMENTO_SELECTED_PROJECTS) as ProjectConfig[];
  const accessToken = await getAccessToken(context, isProduction);
  
  for(let selectedProject of selectedProjects) {
    const vsCodeInstanceId = createVSCodeIdToken(userId, userOrgId, selectedProject.versionControlParams, selectedProject.packageJsonParams, selectedProject.folderName);
    return await disconnectVsCodeInstance(accessToken, userId, vsCodeInstanceId, isProduction);
  }
  return {};
};