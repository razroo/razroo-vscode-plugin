import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import parseGitConfig from 'parse-git-config';
// import getBranch from 'git-branch';
import { ProjectConfig } from './interfaces/project-config.interfaces';
import { combinePackageJsons, PackageJson } from '../utils/package-json/package-json';

export async function getVersionControlParams(workspacePath: string) {
  const gitOrigin = await parseGitConfig({ cwd: workspacePath, path: '.git/config' }).then(gitConfig => gitConfig?.['remote "origin"']?.url);
  // const gitBranch = await getBranch(workspacePath);
  const path = workspacePath;

  return {
    gitOrigin,
    gitBranch: '',
    path
  };
}

export async function getProjectConfigs(dir: string): Promise<ProjectConfig> { 
  // const subdirs = fs.readdirSync(dir);
  // get top level git config, and package json first
  let ignorePatterns: string[] = [];
  const gitignorePath = path.join(dir, '.gitignore');
  const versionControlParams = await getVersionControlParams(dir);
  if(!versionControlParams) {
    return undefined as any;
  }

  const packageJsonPath = path.join(dir, 'package.json');
  let packageJsonParams: PackageJson | object = {};
  if (await fileExists(packageJsonPath)) {
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');
    packageJsonParams = JSON.parse(packageJsonContent);
  }
  
  // BEGIN NEW LOGIC - get ignore patterns for use with application
  if (await fileExists(gitignorePath)) {
    ignorePatterns = await getGitignorePatterns(gitignorePath);
  }
  const subdirs = fs.readdirSync(dir);
  // uses an array, so taking string of dir and putting in array
  try {
    let combinedPackageJsonParams: PackageJson = {
      name: '',
      version: '',
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      ...packageJsonParams
    };
    packageJsonParams = await aggregatePackageJsons(dir, subdirs, gitignorePath, combinedPackageJsonParams);
  } catch (error) {
    console.error(error);
  }
  
  async function aggregatePackageJsons(dir: string, subdirs: string[], gitignorePath: string, combinedPackageJsonParams: PackageJson ) {
    for (let fileName of subdirs) {
      const fullFilePath = path.join(dir, fileName);
      const stat = fs.statSync(fullFilePath);
      if(await isGitIgnored(gitignorePath, fullFilePath)) {
        continue;
      } 
      
      if(fileName.startsWith('package.json')) {
        const fullFilePath = path.join(dir, fileName);
        const packageJsonContentChild = await fs.promises.readFile(fullFilePath, 'utf8');
        const packageJsonTemp = JSON.parse(packageJsonContentChild) as any;
        combinedPackageJsonParams = await combinePackageJsons(combinedPackageJsonParams, packageJsonTemp);
      } else {
        if (stat.isDirectory() && fileName !== '.git' ) {
          const childSubDirs = fs.readdirSync(fullFilePath);
          await aggregatePackageJsons(fullFilePath, childSubDirs, gitignorePath, combinedPackageJsonParams);
        }
      }
    }
    return combinedPackageJsonParams;
  }

  // END NEW LOGIC

  console.log('packageJsonParams');
  console.log(packageJsonParams);

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

// Check if file is ignored
async function isGitIgnored(gitIgnorePath: string, fullFilePath: string): Promise<boolean> {
  if (!fs.existsSync(gitIgnorePath)) {
    return false;
  }
  const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf-8');
  const patterns = gitIgnoreContent.split('\n').filter((pattern) => pattern.trim() !== '');
  return patterns.some((pattern) => {
    const isNegated = pattern.startsWith('!');
    const patternToMatch = isNegated ? pattern.slice(1) : pattern;
    const isMatch = fullFilePath.includes(patternToMatch);
    return isNegated ? !isMatch : isMatch;
  });
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