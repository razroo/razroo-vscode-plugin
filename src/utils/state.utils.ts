import {
    MEMENTO_RAZROO_ID_TOKEN,
    MEMENTO_RAZROO_REFRESH_TOKEN,
    MEMENTO_RAZROO_USER_ID,
  } from '../constants.js';

export function setWorkspaceState(context, idToken: string, refreshToken: string, userId: string, isInProgress?: boolean): void {
    isInProgress && context.workspaceState.update(MEMENTO_RAZROO_ID_TOKEN, idToken);
    isInProgress && context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, refreshToken);
    isInProgress && context.workspaceState.update(MEMENTO_RAZROO_USER_ID, userId);
}