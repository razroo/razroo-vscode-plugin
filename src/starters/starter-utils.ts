import { join } from 'path';
import { MEMENTO_RAZROO_ORG_ID } from '../constants';
import * as vscode from 'vscode';
const os = require('os');

export function createRootForStarterRepo(context: vscode.ExtensionContext, projectName: string) {
  const homeDirectory = os.homedir();
  const userOrgId = context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string;
  return userOrgId ? join(homeDirectory, userOrgId, projectName) : join(homeDirectory, projectName); 
}
