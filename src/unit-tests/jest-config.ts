import * as path from 'path';
import * as fs from 'fs';

export function findConfigPath(targetPath: string): string {
  let targetFilePath: string = path.dirname(targetPath);
  let currentFolderPath: string = path.dirname(targetPath);
  let currentFolderConfigPath: string;
  do {
    for (const configFilename of ['jest.config.js', 'jest.config.ts']) {
      currentFolderConfigPath = path.join(currentFolderPath, configFilename);

      if (fs.existsSync(currentFolderConfigPath)) {
        return currentFolderConfigPath;
      }
    }
    currentFolderPath = path.join(currentFolderPath, '..');
  } while (currentFolderPath !== targetFilePath);
  return '';
}