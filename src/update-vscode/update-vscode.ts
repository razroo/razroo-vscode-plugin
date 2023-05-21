import * as vscode from 'vscode';
import { setWorkspaceState } from "../utils/state.utils";
import { createDisposableAuthServer } from "../auth/local";
import { updatePrivateDirectoriesInVSCodeAuthentication } from "../utils/utils";
import { subscribeToGenerateVsCodeDownloadCodeSub } from "../utils/graphql.utils";
import { getAuth0Url } from '../utils/authentication/authentication';
import { createVSCodeIdToken } from '../utils/token/token';
import { ProjectConfig } from '../projects/interfaces/project-config.interfaces';
import { getUserOrganizations } from '../projects/organizations/organizations.service';
import { v4 as uuidv4 } from 'uuid';
import { subscribeToSendAuthData } from '../auth/auth-data';

export async function updateVsCode(context: vscode.ExtensionContext, isProduction: boolean, selectedProjects: ProjectConfig[], projectsProvider: any) {
    const loginUrl = getAuth0Url(isProduction);
    
    let isInProgress = true;
    let disposeServer;
    const uuid = uuidv4();
    const urlWithUuid = `${loginUrl}/${uuid}`;
    try {
        isInProgress && await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(urlWithUuid));
        const { createServerPromise, dispose } = createDisposableAuthServer(isProduction, uuid);
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
          vscode.window.showInformationMessage('User successfully authenticated with Razroo.');
          if(projectsProvider) {
            const userOrganizations = await getUserOrganizations(userId, isProduction, context);
            await projectsProvider?.view?.webview.postMessage({
              command: "sendAuthData",
              organizations: userOrganizations,
              selectedProjects: selectedProjects,
              userId: userId,
              orgId: orgId
            });
          }
        }
    } catch (error) {
        vscode.window.showErrorMessage(error as any);
    } finally {
        disposeServer();
    }
}