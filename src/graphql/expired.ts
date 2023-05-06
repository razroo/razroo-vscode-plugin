import * as vscode from 'vscode';
import { COMMAND_AUTH0_AUTH, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_REFRESH_TOKEN } from "../constants";
import jwt_decode from "jwt-decode";
import { refreshAuth0Token } from '../utils/graphql.utils';

/** 
 * isTokenExpired - Determines if accessToken is expired
 * Used for triggering token refresh
 */
export function isTokenExpired(accessToken: string): boolean {
  let decodedIdToken: any = jwt_decode(accessToken);

  if (((decodedIdToken.exp as number) * 1000) - Date.now() <= 0) {
    return true;  
  }
  else {
    return false;
  }
}

export async function refreshAccessToken(context: vscode.ExtensionContext, isProduction: boolean): Promise<any> {
  try {
    const refreshToken = await context.globalState.get(MEMENTO_RAZROO_REFRESH_TOKEN) as string;
    const userData = await refreshAuth0Token(refreshToken, isProduction);

    await context.globalState.update(MEMENTO_RAZROO_ACCESS_TOKEN, userData.access_token);
    await context.globalState.update(MEMENTO_RAZROO_REFRESH_TOKEN, userData.refresh_token);
    await vscode.window.showInformationMessage('User successfully authenticated with Razroo.');
    return userData.access_token;
  } catch (err) {
    console.log('refresh token error');
    console.log(err);
    vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
    return undefined;
  }
};


export async function getAccessToken(context: vscode.ExtensionContext, isProduction: boolean) {
  const accessToken = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN) as string;
  if (isTokenExpired(accessToken)) {
    const newToken = await refreshAccessToken(context, isProduction);
    return newToken;
  }
  return accessToken;
}