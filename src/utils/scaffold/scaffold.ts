import { getNameFilePathFromFullPath, getNameFromFullPath } from '../../common-utils/scaffold/scaffold.utils';
import { getVersionAndNameString } from "@razroo/razroo-codemod";
import {startCase} from "lodash";
import { COMMUNITY, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_ORG_ID, MEMENTO_RAZROO_USER_ID } from "../../constants";
import { generateVsCodeDownloadCode } from '../../graphql/generate-code/generate-code.service';

export function createScaffoldSubmenu(pathId: string, scaffoldId: string) {
  return {
    "command": `generate.${pathId}.${scaffoldId}`,
    "group": "myextension.myGroup",
    "when": "razroo-vscode-plugin:isAuthenticated"
  }; 
}

export function createScaffoldCommand(pathId: string, scaffoldId: string) {
  const { name } = getVersionAndNameString(pathId);
  const title = startCase(`${name} ${scaffoldId}`);
  return {
    "command": `generate.${pathId}.${scaffoldId}`,
    "title": title
  };
}

export function buildScaffoldFunctionStatement(pathId: string, scaffoldId: string, recipeId: string) {
  return `
    return vscode.commands.registerCommand(
      generate.${pathId}.${scaffoldId},
        async ({path}) => createScaffold('${pathId}', ${recipeId}, path, context, isProduction, ${scaffoldId}, packageJsonParams)
      );
  `;
}

export function createScaffold(vscode, pathId: string, recipeId: string, path: string, context, isProduction: boolean, scaffoldId: string, packageJsonParams){
  const orgId = COMMUNITY;
  const nameFilePath = getNameFilePathFromFullPath(vscode, path);
  const name = getNameFromFullPath(path);
  const parsedPackageJsonParams = typeof packageJsonParams === 'string' ? JSON.parse(packageJsonParams) : packageJsonParams;
  
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
    vsCodeInstanceId: context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN) as string,
    userId: context.workspaceState.get(MEMENTO_RAZROO_USER_ID) as string,
    userOrgId: context.workspaceState.get(MEMENTO_RAZROO_ORG_ID) as string,
  };

  generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters, context, isProduction).then(data => {
    console.log('data');
    console.log(data);
  });
}