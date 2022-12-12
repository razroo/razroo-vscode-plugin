import parseGitConfig from 'parse-git-config';
import { EMPTY, MEMENTO_RAZROO_ID_VS_CODE_TOKEN } from './../../constants';
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { extractProjectName } from '@razroo/razroo-codemod';
import { isEmptyWorkspace } from '../../utils/directory.utils';

export async function getOrCreateAndUpdateIdToken(context: vscode.ExtensionContext): Promise<string> {
    let token: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
    if (!token) {
      if(isEmptyWorkspace()) {
        return EMPTY;
      }
      const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      const gitOrigin = await parseGitConfig({ cwd: workspacePath, path: '.git/config' }).then(gitConfig => {
        return gitConfig?.['remote "origin"']?.url;
      });
      token = gitOrigin ? extractProjectName(gitOrigin) : EMPTY;
      context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, token);
      return token as string;
    }
    else {
      return token;  
    }
}