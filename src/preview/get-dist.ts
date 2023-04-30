import * as fs from 'fs';
import * as path from 'path';

export function getDistFolder(workspaceFolder: string): string | null {
  let currentPath = path.join(workspaceFolder, 'dist');
  
  while (true) {
    const files = fs.readdirSync(currentPath);
    const file = files.find((file) => fs.statSync(path.join(currentPath, file)).isFile());
    if (file) {
      return currentPath;
    }
    const subfolders = files.filter((file) => fs.statSync(path.join(currentPath, file)).isDirectory());
    if (subfolders.length === 0) {
      return null;
    }
    currentPath = path.join(currentPath, subfolders[0]);
  }
}  
