import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { cleanWorkspace, getBuildTasks } from '../utils/terminal-utils/terminal-utils';
import { getDistFolder } from './get-dist';
import { PreviewStateObject } from './preview.interface';

const showInformationMessage = vscode.window.showInformationMessage;

export async function generatePreviewFiles(workspaceFolder: string, accessToken: string, isProduction: boolean, previewStateObject: PreviewStateObject) {
    // entryName will always be unit test
    // spec logic put in place just to make sure nothing bad happens
    const distFolder = path.join(workspaceFolder, 'dist');
    const isWindows = process.platform === 'win32';
    const rmCommand = isWindows ? 'rimraf' : 'rm -rf';
    const execution = new vscode.ShellExecution(`${rmCommand} ${distFolder}; cd ${workspaceFolder}; npm run build`);
    const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'Razroo Terminal', 'Razroo', execution);
    // These two functions in tandem allow us to figure out when task completed
    const buildTasks = getBuildTasks();
    await executeBuildTask(task, accessToken, isProduction, workspaceFolder, previewStateObject);
}

async function executeBuildTask(task: vscode.Task, accessToken: string, isProduction: boolean, workspaceFolder: string, previewStateObject: PreviewStateObject) {
    const execution = await vscode.tasks.executeTask(task);

    return new Promise<void>(resolve => {
        let disposable = vscode.tasks.onDidEndTask(async (e) => {
            if (e.execution === execution) {
                showInformationMessage(`generate preview build has run successfully.`);
                // await cleanWorkspace();
                //send mutation with results
                // saveTestOutputMutation(accessToken, isProduction, testType, testOutputContent, template.orgId, template.pathId, template.recipeId, template.id ).then((data:any)=>{
                //     console.log('data from mutation: ', data?.data?.saveTestOutput);
                // });
                const distFolder = getDistFolder(workspaceFolder);
                if(distFolder) {
                  await readFilesInDistFolder(distFolder, previewStateObject);
                }
                
                disposable.dispose();
                resolve();
            }
        });
    });
}

async function readFilesInDistFolder(folderPath: string, previewStateObject: PreviewStateObject): Promise<void> {
  console.log('previewStateObject');
  console.log(previewStateObject);
  try {
    const files = await fs.promises.readdir(folderPath);
    for (const file of files) {
      const fileContent = await fs.promises.readFile(`${folderPath}/${file}`, 'utf8');
      const fileName = file;
      const fileType = path.extname(file);
      // console.log(`Contents of ${file}:`);
      // console.log(data);
    }
  } catch (err) {
    console.error(`Error reading files in folder: ${err}`);
  }
}
