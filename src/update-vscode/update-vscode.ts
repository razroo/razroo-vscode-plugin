import * as vscode from 'vscode';
import { setWorkspaceState } from "../utils/state.utils";
import { createDisposableAuthServer } from "../auth/local";
import { onVSCodeClose, updatePrivateDirectoriesInVSCodeAuthentication } from "../utils/utils";
import { subscribeToGenerateVsCodeDownloadCodeSub } from "../utils/graphql.utils";
import { getAuth0Url } from '../utils/authentication/authentication';
import { createVSCodeIdToken, getOrCreateAndUpdateIdToken } from '../utils/token/token';
import { ProjectConfig } from '../projects/interfaces/project-config.interfaces';


export async function updateVsCode(context: vscode.ExtensionContext, isProduction: boolean, selectedProjects: ProjectConfig[], projectsProvider: any) {
    const loginUrl = getAuth0Url(isProduction);
    
    let isInProgress = true;
    let disposeServer;
    try {
        isInProgress && await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(loginUrl));
        const { createServerPromise, dispose } = createDisposableAuthServer();
        disposeServer = dispose;
        const { accessToken = '', refreshToken = '', userId = '', orgId = '' } = isInProgress ? await createServerPromise : {};
        setWorkspaceState(context, accessToken, refreshToken, userId, orgId, isInProgress);
        if(isInProgress) {
          if(selectedProjects) {
            for(let selectedProject of selectedProjects) {
              const vsCodeInstanceId = createVSCodeIdToken(userId, selectedProject.versionControlParams);
              await updatePrivateDirectoriesInVSCodeAuthentication(accessToken, isProduction, userId, orgId, selectedProjects);
              await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId, context, isProduction, selectedProjects });    
            }
          }
        }

        isInProgress && vscode.window.showInformationMessage('User successfully authenticated with Razroo.');
        // if(vsCodeInstanceId === 'no-git-found') {
        //   showInformationMessage('Please initialize a git repo to get started');
        // }
        // else {
        
        // }
    } catch (error) {
        vscode.window.showErrorMessage(error as any);
    } finally {
        if(projectsProvider){ 
        await projectsProvider?.view?.webview.postMessage({
            command: "sendAuthData"
        });
        }
        disposeServer();
    }
}