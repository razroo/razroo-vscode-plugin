import * as vscode from 'vscode';
import { COMMAND_AUTH0_AUTH, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_REFRESH_TOKEN, MEMENTO_SELECTED_PROJECTS } from "../constants";
import { jwtDecode } from "jwt-decode";
import { refreshAuth0Token } from '../utils/graphql.utils';
import { updateVsCode } from '../update-vscode/update-vscode';
import { ProjectConfig } from '../projects/interfaces/project-config.interfaces';
import { ProjectsWebview } from '../projects/projects';

/** 
 * isTokenExpired - Determines if accessToken is expired
 * Used for triggering token refresh
 */
export function isTokenExpired(accessToken: string): boolean {
  try {
    let decodedIdToken: any = jwtDecode(accessToken);
    if (((decodedIdToken.exp as number) * 1000) - Date.now() <= 0) {
      return true;  
    } else {
      return false;
    }
  } catch (error: any) {
    console.error('Invalid token specified:', error.message);
    return true; // Treat invalid token as expired
  }
}

export async function refreshAccessToken(context: vscode.ExtensionContext, isProduction: boolean): Promise<any> {
  try {
    const refreshToken = await context.globalState.get(MEMENTO_RAZROO_REFRESH_TOKEN) as string;
    const userData = await refreshAuth0Token(refreshToken, isProduction);

    await context.globalState.update(MEMENTO_RAZROO_ACCESS_TOKEN, userData.access_token);
    await context.globalState.update(MEMENTO_RAZROO_REFRESH_TOKEN, userData.refresh_token);
    await vscode.window.showInformationMessage('User successfully authenticated with Razroo[refreshed].');
    return userData.access_token;
  } catch (err) {
    console.error('Error refreshing token:', err);
    const projectsProvider = new ProjectsWebview(context);
    const selectedProjects = await context.globalState.get(MEMENTO_SELECTED_PROJECTS) as ProjectConfig[];
    const selectedProjectsArr: ProjectConfig[] = selectedProjects ? selectedProjects : [];
    await updateVsCode(context, isProduction, selectedProjectsArr, projectsProvider);
    await vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
    return undefined;
  }
};


export async function getAccessToken(context: vscode.ExtensionContext, isProduction: boolean) {
  const accessToken = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN) as string;
  const refreshToken = context.globalState.get(MEMENTO_RAZROO_REFRESH_TOKEN) as string;
  
  console.log('accessToken', accessToken);
  console.log('refreshToken', refreshToken);
  let accessTokenExpiry: number | undefined = 0; 
  let refreshTokenExpiry: number | undefined = 0;

  if (accessToken) {
    const decodedAccessToken: any = jwtDecode(accessToken);
    accessTokenExpiry = decodedAccessToken.exp * 1000; // Convert to milliseconds
  }

  const now = Date.now();

  if (now >= accessTokenExpiry - 5 * 60 * 1000) { // 5 minutes before expiry
    try {
      const newTokens = await refreshAccessToken(context, isProduction);
      return newTokens.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
      return null;
    }
  }

  return accessToken;
}