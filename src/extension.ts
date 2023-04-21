// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { onVSCodeClose, tryToAuth } from './utils/utils';
import {
  COMMAND_AUTH0_AUTH,
  COMMAND_CANCEL_AUTH,
  COMMAND_TRY_TO_AUTH,
  MEMENTO_SELECTED_PROJECTS,
  ACTIVE_WORKSPACE_FOLDER_PROJECT_CONFIG,
  COMMAND_CONNECT_PROJECTS_TRY_TO_AUTH,
  COMMAND_LOG_OUT_USER
} from './constants';
import { EventEmitter } from 'stream';
import { pushScaffoldCommands } from './utils/scaffold/push-scaffold-commands';
import { logCursorPosition } from './snippets/log-position';
import {debounce} from 'lodash';
import { ProjectsWebview } from './projects/projects';
import { updateVsCode } from './update-vscode/update-vscode';
import { getProjectConfigs } from './projects/project-configs';
import { getWorkspaceFolders } from './utils/directory.utils';
import { ProjectConfig } from './projects/interfaces/project-config.interfaces';
import { determineLanguagesUsed } from './scaffolds/determine-languages-used';
import { getAuth0LogoutUrl } from './utils/authentication/authentication';
import { resetWorkspaceState } from './utils/state.utils';

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
      const packageJsonParams = individualProjectConfig.packageJsonParams;
      const workspaceFolderName = workspaceFolder.name;
      // use workspace folder name, to create state for project config
      // will allow active state for that workspace folder to be pulled up
      // whenever user is inside of that folder
      await determineLanguagesUsed(packageJsonParams).then(async(languagesUsed) => {
        languagesUsed.forEach(languageUsed => {
          vscode.commands.executeCommand('setContext', `razroo-vscode-plugin-language:${languageUsed}`, true);
        });
      });

      context.workspaceState.update(workspaceFolderName, individualProjectConfig);
      projectConfigs.push(individualProjectConfig);
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

  const connectProjectsTryToAuthCommmand = vscode.commands.registerCommand(
    COMMAND_CONNECT_PROJECTS_TRY_TO_AUTH,
    async({selectedProjects, orgId}) => {
      try {
        context.workspaceState.update(MEMENTO_SELECTED_PROJECTS, selectedProjects);
        await tryToAuth(context, isProduction, projectsProvider, projectConfigs, orgId);
      } catch (error) {
        console.log('COMMAND_TRY_TO_AUTH ERROR');
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

  context.subscriptions.push(tryToAuthCommmand);
  context.subscriptions.push(connectProjectsTryToAuthCommmand);
  context.subscriptions.push(auth0Authentication);
  context.subscriptions.push(cancelAuthentication);
  context.subscriptions.push(logout);
  context.subscriptions.push(logoutUser);

  // execute command for tryToAuth to re-connect previously connected projects
  const selectedProjects = context.workspaceState.get(MEMENTO_SELECTED_PROJECTS);
  if(selectedProjects) {
    vscode.commands.executeCommand(COMMAND_TRY_TO_AUTH);
  }

  vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:activated', true);
}

// this method is called when your extension is deactivated
export async function deactivate() {
  const context = await vscode.commands.executeCommand('getContext') as vscode.ExtensionContext;
  const isProduction = isProductionFunc(context);
  vscode.commands.executeCommand('setContext', 'razroo-vscode-plugin:activated', false);
  await onVSCodeClose(context, isProduction);
};