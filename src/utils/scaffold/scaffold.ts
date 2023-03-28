import { getNameFilePathFromFullPath, getNameFromFullPath } from '../../common-utils/scaffold/scaffold.utils';
import { getVersionAndNameString } from "@codemorph/core";
import { startCase, camelCase } from "lodash";
import { COMMUNITY, MEMENTO_RAZROO_ORG_ID, MEMENTO_RAZROO_USER_ID } from "../../constants";
import { generateVsCodeDownloadCode } from '../../graphql/generate-code/generate-code.service';
import { createVSCodeIdToken } from '../../utils/token/token';

export function createScaffoldSubmenu(pathId: string, scaffoldId: string) {
  const { name } = getVersionAndNameString(pathId);

  return {
    "command": `generate.${pathId}.${scaffoldId}`,
    "group": "myextension.myGroup",
    "when": `razroo-vscode-plugin:isAuthenticated && razroo-vscode-plugin-language:${name}`
  }; 
}

export function createScaffoldCommand(pathId: string, scaffoldId: string) {
  const { name } = getVersionAndNameString(pathId);
  let title;
  if(scaffoldId.indexOf(name) > - 1) {
    title = startCase(`${scaffoldId}`);
  }
  else {
    title = startCase(`${name} ${scaffoldId}`);
  }
  return {
    "command": `generate.${pathId}.${scaffoldId}`,
    "title": title
  };
}

export function buildScaffoldFunctionStatement(pathId: string, scaffoldId: string, recipeId: string) {
  const { name } = getVersionAndNameString(pathId);
  
  return `return vscode.commands.registerCommand(
    'generate.${name}.${camelCase(scaffoldId)}',
      async ({path}) => createScaffold(vscode, '${pathId}', '${recipeId}', path, context, isProduction, '${scaffoldId}')
    );`;
}

export function buildPushScaffoldCommandsStatement(scaffoldCommands: any[]) {
  return `context.subscriptions.push(${scaffoldCommands})`;
}

export function createScaffold(vscode, pathId: string, recipeId: string, path: string, context, isProduction: boolean, scaffoldId: string){
  let uri = vscode.Uri.file(path);
  let workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  const workspaceProjectConfig = context.workspaceState.get(workspaceFolder.name);
  const userId = context.globalState.get(MEMENTO_RAZROO_USER_ID);
  const packageJsonParams = workspaceProjectConfig.packageJsonParams;
  const versionControlParams = workspaceProjectConfig.versionControlParams;
  const vsCodeInstanceId = createVSCodeIdToken(userId, versionControlParams);
  // automatically expand folder so files generated appear
  vscode.commands.executeCommand('list.expand', uri);
  const cancelAction = {
    title: "Cancel",
    action: () => {
      console.log("Cancel scaffolding button clicked");
    }
  };

  vscode.window.showInformationMessage("Scaffold generating...", cancelAction).then(selectedAction => {
    if (selectedAction === cancelAction) {
      console.log("Cancel button clicked");
    }
  });
  
  const orgId = COMMUNITY;
  const nameFilePath = getNameFilePathFromFullPath(workspaceFolder, path);
  const name = getNameFromFullPath(path);
  const parsedPackageJsonParams = typeof packageJsonParams === 'string' ? JSON.parse(packageJsonParams) : packageJsonParams;
  
  // this needs to be updated to work with projects
  const parameters = {
    nameFilePath: nameFilePath,
    name: name,
    projectName: parsedPackageJsonParams.name
  };

  const generateVsCodeDownloadCodeParameters = {
    projectName: parsedPackageJsonParams.name,
    parameters: JSON.stringify(parameters),
    pathOrgId: orgId,
    pathId: pathId,
    recipeId: recipeId,
    stepId: scaffoldId,
    vsCodeInstanceId: vsCodeInstanceId,
    userId: userId,
    userOrgId: context.globalState.get(MEMENTO_RAZROO_ORG_ID) as string,
  };

  generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters, context, isProduction).then(data => {
  });
}