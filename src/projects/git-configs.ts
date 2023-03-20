import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

export async function getAllGitConfigs(dir: string): Promise<Record<string, string>[]> {
  const configs: Record<string, string>[] = [];
  // Load the root .gitignore file, if it exists
  let ignorePatterns: string[] = [];
  const gitignorePath = path.join(dir, '.gitignore');
  if (await fileExists(gitignorePath)) {
    ignorePatterns = await getGitignorePatterns(gitignorePath);
  }

  const subdirs = fs.readdirSync(dir, { withFileTypes: true });
  for (const subdir of subdirs) {
    const filePath = path.join(dir, subdir.name);
    if (ignorePatterns.some((pattern) => {
      return filePath.startsWith(filePath) && subdir.name !== '.git';
    })) {
      continue;
    }
    if (subdir.isDirectory()) {
      const subdirConfigs = await getAllGitConfigs(filePath);
      configs.push(...subdirConfigs);
    } else if (subdir.isFile() && subdir.name === 'config') {
      const configPath = path.join(dir, subdir.name);
      const configData = fs.readFileSync(configPath, 'utf-8');
      const regex = /\[(.*)\]\n([\s\S]*?)(?=\n\[|$)/g;
      let match: any;
      const config: Record<string, string> = {};
      while ((match = regex.exec(configData)) !== null) {
        const section = match[1];
        const sectionData = match[2];
        const sectionRegex = /^\s*(.*?)\s*=\s*(.*?)\s*$/gm;
        let sectionMatch: any;
        while ((sectionMatch = sectionRegex.exec(sectionData)) !== null) {
          const key = `${section}.${sectionMatch[1]}`;
          const value = sectionMatch[2];
          config[key] = value;
        }
      }
      config.path = dir;
      configs.push(config);
    }
  }

  return configs;
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