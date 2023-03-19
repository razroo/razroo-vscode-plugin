import * as vscode from 'vscode';
import { setWorkspaceState } from "../utils/state.utils";
import { createDisposableAuthServer } from "../auth/local";
import { onVSCodeClose, updatePrivateDirectoriesInVSCodeAuthentication } from "../utils/utils";
import { subscribeToGenerateVsCodeDownloadCodeSub } from "../utils/graphql.utils";
import { PackageJson } from "../utils/package-json/package-json";
import { getAuth0Url } from '../utils/authentication/authentication';
import { getOrCreateAndUpdateIdToken } from '../utils/token/token';


export async function updateVsCode(context: vscode.ExtensionContext, isProduction: boolean, selectedProjects: PackageJson[], projectsProvider: any) {
    const loginUrl = getAuth0Url(isProduction);
    
    let isInProgress = true;
    let disposeServer;
    try {
        isInProgress && await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(loginUrl));
        const { createServerPromise, dispose } = createDisposableAuthServer();
        disposeServer = dispose;
        const { accessToken = '', refreshToken = '', userId = '', orgId = '' } = isInProgress ? await createServerPromise : {};
        setWorkspaceState(context, accessToken, refreshToken, userId, orgId, isInProgress);
        const vsCodeInstanceId = await getOrCreateAndUpdateIdToken(context, userId);
        // if(vsCodeInstanceId === 'no-git-found') {
        //   showInformationMessage('Please initialize a git repo to get started');
        // }
        // else {
        isInProgress && await updatePrivateDirectoriesInVSCodeAuthentication(vsCodeInstanceId!, accessToken, isProduction, userId, orgId, selectedProjects);
        isInProgress && await subscribeToGenerateVsCodeDownloadCodeSub({ vsCodeInstanceId, context, isProduction, selectedProjects });
        isInProgress && vscode.window.showInformationMessage('User successfully authenticated with Razroo.');
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