import { getVersionAndNameString } from "@razroo/razroo-codemod";
import {startCase} from "lodash";

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