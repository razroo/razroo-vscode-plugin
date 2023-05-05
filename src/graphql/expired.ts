import * as vscode from 'vscode';
import { COMMAND_AUTH0_AUTH, MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_REFRESH_TOKEN } from "../constants";
import jwt_decode from "jwt-decode";
import { auth0Client } from '../utils/graphql.utils';

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

async function refreshAccessToken(context, isProduction: boolean) {
    const refreshToken = await context.globalState.get(MEMENTO_RAZROO_REFRESH_TOKEN);
    return auth0Client(isProduction).refreshToken({ refresh_token: refreshToken }, async function (err, userData) {
      if (err) {
        vscode.commands.executeCommand(COMMAND_AUTH0_AUTH);
      }
  
      await context.globalState.update(MEMENTO_RAZROO_ACCESS_TOKEN, userData.access_token);
      await context.globalState.update(MEMENTO_RAZROO_REFRESH_TOKEN, userData.refresh_token);
      await vscode.window.showInformationMessage('User successfully authenticated with Razroo.');
      return userData;
    });
  };

export async function getAccessToken(context, isProduction: boolean) {
  const accessToken = context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN);
  if (isTokenExpired(accessToken)) {
    const newToken = await refreshAccessToken(accessToken, isProduction);
    context.globalState.get(MEMENTO_RAZROO_ACCESS_TOKEN, newToken);
    return newToken;
  }
  return accessToken;
}