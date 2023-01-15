export function createScaffoldSubmenu(pathId: string, scaffoldId: string) {
  return {
    "command": `generate.${pathId}.${scaffoldId}`,
    "group": "myextension.myGroup",
    "when": "razroo-vscode-plugin:isAuthenticated"
  }; 
}

export function createScaffoldCommand(pathId: string, scaffoldId: string) {
    return {        
      "command": `generate.${pathId}.${scaffoldId}`,
      "title": "Angular Component"
    }; 
  }