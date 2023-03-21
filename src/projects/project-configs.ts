import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import parseGitConfig from 'parse-git-config';
import getBranch from 'git-branch';
import { ProjectConfig } from './interfaces/project-config.interfaces';

export async function getVersionControlParams(workspacePath: string) {
  const gitOrigin = await parseGitConfig({ cwd: workspacePath, path: '.git/config' }).then(gitConfig => gitConfig?.['remote "origin"']?.url);
  const gitBranch = await getBranch(workspacePath);
  const path = workspacePath;

  return {
    gitOrigin,
    gitBranch,
    path
  };
}

export async function getProjectConfigs(dir: string): Promise<ProjectConfig> { 
  // const subdirs = fs.readdirSync(dir);
  // get top level git config, and package json first
  // let ignorePatterns: string[] = [];
  const packageJsonPath = path.join(dir, 'package.json');
  // const gitignorePath = path.join(dir, '.gitignore');
  const versionControlParams = await getVersionControlParams(dir);
  
  const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');
  const packageJsonParams = JSON.parse(packageJsonContent) as any;
  // if (await fileExists(gitignorePath)) {
  //   ignorePatterns = await getGitignorePatterns(gitignorePath);
  // }
  
  // for (const filePath of subdirs) { 
  //   if (ignorePatterns.some((pattern) => filePath.startsWith(filePath))) {
  //     continue;
  //   }

  // }
  return {
    versionControlParams,
    packageJsonParams
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getGitignorePatterns(gitignorePath: string): Promise<string[]> {
  const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf8');
  return gitignoreContent
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))
    .map((line: any) => path.join(path.dirname(gitignorePath), line));
}

export async function findGitFolders(parentFolder: string, gitFolders: any[] = []): Promise<string[]> {
  // Create an ignore object based on the parentFolder's .gitignore file
  const ignoreRules = fs.readFileSync(path.join(parentFolder, '.gitignore'), 'utf8');
  const ig = ignore().add(ignoreRules);

  async function search(folder: string) {
    const files = fs.readdirSync(folder);

    for (const file of files) {
      const filePath = path.join(folder, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Check if the folder is gitignored
        if (!ig.filter([filePath]).length) {
          if (file === '.git') {
            gitFolders.push(filePath);
          } else {
            return await search(filePath);
          }
        }
      }
    }
  };

  return await search(parentFolder);
}