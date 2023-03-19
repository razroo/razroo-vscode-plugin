import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  name: string;
  version: string;
  // add any other properties you need
}

export async function getAllPackageJsons(repoPath: string): Promise<PackageJson[]> {
  const packageJsons: PackageJson[] = [];

  // Recursive function to traverse the directory structure and find package.json files
  async function traverseDirectory(directoryPath: string, ignorePatterns: string[]): Promise<void> {
    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);

      // Skip files or directories that match the ignore patterns
      if (ignorePatterns.some((pattern) => fullPath.startsWith(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        // Load the .gitignore file, if it exists
        let childIgnorePatterns: string[] = [];
        const childGitignorePath = path.join(fullPath, '.gitignore');
        if (await fileExists(childGitignorePath)) {
          childIgnorePatterns = await getGitignorePatterns(childGitignorePath);
        }

        await traverseDirectory(fullPath, [...ignorePatterns, ...childIgnorePatterns]);
      } else if (entry.isFile() && entry.name === 'package.json') {
        try {
          const packageJsonContent = await fs.promises.readFile(fullPath, 'utf8');
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
  if (await fileExists(gitignorePath)) {
    ignorePatterns = await getGitignorePatterns(gitignorePath);
  }

  // Start the traversal at the root of the repository
  await traverseDirectory(repoPath, ignorePatterns);

  return packageJsons;
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
    .map((line) => path.join(path.dirname(gitignorePath), line));
}
