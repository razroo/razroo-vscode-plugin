import {
    MEMENTO_RAZROO_ACCESS_TOKEN,
    MEMENTO_RAZROO_REFRESH_TOKEN,
    MEMENTO_RAZROO_USER_ID,
    MEMENTO_RAZROO_ORG_ID
  } from '../constants';

export function setWorkspaceState(context, idToken: string, refreshToken: string, userId: string, orgId: string, isInProgress?: boolean): void {
    isInProgress && context.workspaceState.update(MEMENTO_RAZROO_ACCESS_TOKEN, idToken);
    isInProgress && context.workspaceState.update(MEMENTO_RAZROO_REFRESH_TOKEN, refreshToken);
    isInProgress && context.workspaceState.update(MEMENTO_RAZROO_USER_ID, userId);
    isInProgress && context.workspaceState.update(MEMENTO_RAZROO_ORG_ID, orgId);
}