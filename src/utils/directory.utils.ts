import * as vscode from 'vscode';
import * as path from 'path';
import { globifyGitIgnore } from "globify-gitignore";
import ignore from 'ignore';
import * as fs from 'fs';

export function getWorkspaceFolders() {
  console.log("VSCODE WORKSPACE FOLDERS: ", vscode.workspace?.workspaceFolders);
  return vscode.workspace?.workspaceFolders?.map((folder) => {
    return { name: folder.name, path: folder?.uri?.fsPath };
  });
};

// will be true if no folders in the vscode instance
export function isEmptyWorkspace(): boolean {
  return vscode.workspace.workspaceFolders ? false : true;
}

const readGitIgnoreFile = async (dir = '') => {
  const gitignorePath = vscode.workspace.workspaceFolders ? path.join(vscode.workspace.workspaceFolders[0].uri.fsPath as any + '/' + dir, '.gitignore') : '';
  try {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    return {
      path: dir,
      gitignorePatterns: await globifyGitIgnore(gitignoreContent)
      //This hack is needed because the "globifyGitIgnore v0.2.1" returns inverted patterns.
      .then(gitIgnorePatterns => gitIgnorePatterns.map(pattern => pattern.startsWith('!') ? pattern.slice(1) : '!' + pattern)),
    };
  } catch (error) {
    if ((error as Error)?.message.startsWith('ENOENT: no such file or directory')) {
      return {
        path: dir,
        gitignorePatterns: []
      };
    }
    throw error;
  }
};

export const filterIgnoredDirs = async (dirs: Array<string>) => {
  const gitignorePatterns = (await Promise.all(dirs.map(readGitIgnoreFile)))
  .filter(gitignoreFile => gitignoreFile.gitignorePatterns.length)
  .map(gitignoreFile => {
    gitignoreFile.gitignorePatterns = gitignoreFile.gitignorePatterns
    .map(pattern => {
      if(gitignoreFile.path) {
        const newPattern = pattern.split('/');
        newPattern.splice(1, 0, gitignoreFile.path);
        return newPattern.join('/');
      }
      return pattern;
    });
    return gitignoreFile.gitignorePatterns;
  }).flat();

  // Delete first directory which is the root folder
  dirs = dirs.slice(1);
  const gitignore = ignore().add(gitignorePatterns);
  const privateDirs = gitignore.filter(dirs);
  return privateDirs;
};
