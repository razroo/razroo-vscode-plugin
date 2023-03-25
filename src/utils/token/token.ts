import { VersionControlParams } from './../../projects/interfaces/project-config.interfaces';
import parseGitConfig from 'parse-git-config';
import { EMPTY, MEMENTO_RAZROO_ID_VS_CODE_TOKEN } from './../../constants';
import * as vscode from 'vscode';
import { extractProjectName } from '@codemorph/core';
import { isEmptyWorkspace } from '../../utils/directory.utils';

export async function getOrCreateAndUpdateIdToken(context: vscode.ExtensionContext, userId: string): Promise<string> {
    let token: string | undefined = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
    if (!token) {
      if(isEmptyWorkspace()) {
        context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, EMPTY);
        return EMPTY;
      }
      const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      const gitOrigin = await parseGitConfig({ cwd: workspacePath, path: '.git/config' }).then(gitConfig => {
        return gitConfig?.['remote "origin"']?.url;
      }).catch(()=>{
        return "no-git-found";
      });
      if(gitOrigin !== "no-git-found") {
        token = gitOrigin ? `${userId}_${extractProjectName(gitOrigin)}` : EMPTY;
        context.workspaceState.update(MEMENTO_RAZROO_ID_VS_CODE_TOKEN, token);
        return token as string;
      }
      else {
        return "no-git-found";
      }
    }
    else {
      return token;  
    }
}

export function createVSCodeIdToken(userId: string, versionControlParams: VersionControlParams) {
  const gitOrigin = versionControlParams.gitOrigin;
  return gitOrigin ? `${userId}_${extractProjectName(gitOrigin)}` : EMPTY;
}