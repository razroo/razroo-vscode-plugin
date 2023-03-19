import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface PackageJson {
  name: string;
  version: string;
  // add any other properties you need
}

export function getAllPackageJsons(repoPath: string): PackageJson[] {
    const packageJsons: PackageJson[] = [];
  
    // Recursive function to traverse the directory structure and find package.json files
    function traverseDirectory(directoryPath: string, ignorePatterns: string[]) {
      const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  
      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
  
        // Skip files or directories that match the .gitignore patterns
        if (ignorePatterns.some((pattern) => fullPath.startsWith(pattern))) {
          continue;
        }
  
        if (entry.isDirectory()) {
          // Load the .gitignore file, if it exists
          let childIgnorePatterns: string[] = [];
          const childGitignorePath = path.join(fullPath, '.gitignore');
          if (fs.existsSync(childGitignorePath)) {
            childIgnorePatterns = fs
              .readFileSync(childGitignorePath, 'utf8')
              .split(/\r?\n/)
              .filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))
              .map((line) => path.join(fullPath, line));
          }
  
          traverseDirectory(fullPath, [...ignorePatterns, ...childIgnorePatterns]);
        } else if (entry.isFile() && entry.name === 'package.json') {
          try {
            const packageJsonContent = fs.readFileSync(fullPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent) as PackageJson;
            packageJsons.push(packageJson);
          } catch (error) {
            console.error(`Error parsing package.json file at ${fullPath}: ${(error as any).message}`);
          }
        }
      }
    }
  
    // Load the root .gitignore file, if it exists
    let ignorePatterns: string[] = [];
    const gitignorePath = path.join(repoPath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      ignorePatterns = fs
        .readFileSync(gitignorePath, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))
        .map((line) => path.join(repoPath, line));
    }
  
    // Start the traversal at the root of the repository
    traverseDirectory(repoPath, ignorePatterns);
  
    return packageJsons;
  }