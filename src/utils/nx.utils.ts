import * as path from 'path';
import { readPackageJson } from '@razroo/razzle';

export async function readNxJson(workspacePath: string) {
    const nxJsonFilePath = path.join(workspacePath, 'nx.json');
    // official function is for packageJson, but will work for nxJson as well
    // making as any for now to cancel out
    const nxJson = await readPackageJson(nxJsonFilePath) as any;
    // if nxJson is empty make sure returns undefined
    if(!nxJson) {
      return undefined;
    }

    const defaultProject = nxJson.defaultProject;
    return {
      defaultProject: defaultProject
    };
}