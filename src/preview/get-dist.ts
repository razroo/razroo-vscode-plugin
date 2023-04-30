import * as fs from 'fs';
import * as path from 'path';

export function getDistFolder(workspaceFolder: string): string | null {
  const distPath = path.join(workspaceFolder, 'dist');
  const distExists = fs.existsSync(distPath);

  if (!distExists) {
    console.error('The dist folder does not exist.');
    return null;
  }

  const files = fs.readdirSync(distPath);

  for (const file of files) {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && fs.readdirSync(filePath).length > 0) {
      console.log(`Using ${filePath} as the root folder.`);
      return filePath;
    }
  }

  console.error('No folder with files found in the dist folder.');
  return null;
}
