import * as fs from 'fs';
import * as path from 'path';

export async function getAllGitConfigs(dir: string): Promise<Record<string, string>[]> {
  const configs: Record<string, string>[] = [];

  const subdirs = fs.readdirSync(dir, { withFileTypes: true });
  for (const subdir of subdirs) {
    if (subdir.isDirectory()) {
      const subdirConfigs = await getAllGitConfigs(path.join(dir, subdir.name));
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