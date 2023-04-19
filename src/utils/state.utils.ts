import {
    MEMENTO_RAZROO_ACCESS_TOKEN,
    MEMENTO_RAZROO_REFRESH_TOKEN,
    MEMENTO_RAZROO_USER_ID,
    MEMENTO_RAZROO_ORG_ID
  } from '../constants';

export function setWorkspaceState(context, accessToken: string, refreshToken: string, userId: string, orgId: string, isInProgress?: boolean): void {
  isInProgress && context.globalState.update(MEMENTO_RAZROO_ACCESS_TOKEN, accessToken);
  isInProgress && context.globalState.update(MEMENTO_RAZROO_REFRESH_TOKEN, refreshToken);
  isInProgress && context.globalState.update(MEMENTO_RAZROO_USER_ID, userId);
  isInProgress && context.globalState.update(MEMENTO_RAZROO_ORG_ID, orgId);
}

export function resetWorkspaceState(context): void {
  context.globalState.update(MEMENTO_RAZROO_ACCESS_TOKEN, null);
  context.globalState.update(MEMENTO_RAZROO_REFRESH_TOKEN, null);
  context.globalState.update(MEMENTO_RAZROO_USER_ID, null);
  context.globalState.update(MEMENTO_RAZROO_ORG_ID, null);
}