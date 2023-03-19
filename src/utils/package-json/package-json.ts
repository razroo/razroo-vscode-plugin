import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  name: string;
  version: string;
  // add any other properties you need
}

export async function getAllPackageJsons(repoPath: string): Promise<PackageJson[]> {
  const packageJsons: PackageJson[] = [];

  // Read the .gitignore file and return an array of patterns to ignore
  async function getIgnorePatterns(directoryPath: string): Promise<string[]> {
    const gitignorePath = path.join(directoryPath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      return [];
    }
    const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf8');
    return gitignoreContent.split(/\r?\n/)
      .filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))
      .map((line) => path.join(directoryPath, line));
  }

  // Recursive function to traverse the directory structure and find package.json files
  async function traverseDirectory(directoryPath: string, ignorePatterns: string[]) {
    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);

      // Skip files or directories that match the ignore patterns
      if (ignorePatterns.some((pattern) => fullPath.startsWith(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        const childIgnorePatterns = await getIgnorePatterns(fullPath);
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

  // Start the traversal at the root of the repository
  const ignorePatterns = await getIgnorePatterns(repoPath);
  await traverseDirectory(repoPath, ignorePatterns);

  return packageJsons;
}
