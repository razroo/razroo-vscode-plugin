import { MEMENTO_RAZROO_ID_VS_CODE_TOKEN } from './../../constants';
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

export function getOrCreateAndUpdateIdToken(context: vscode.ExtensionContext): string {
    let token: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
    if (!token) {
      token = uuidv4();
      context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, token);
    }
    return token;
}