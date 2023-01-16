import { buildScaffoldFunctionStatement, createScaffoldCommand, createScaffoldSubmenu } from "./scaffold";

describe('createScaffoldSubmenu', () => {
  it('should create a scaffold submenu', () => {
    const pathId = 'angular-15.0.0';
    const scaffoldId = 'component';
    const result = createScaffoldSubmenu(pathId, scaffoldId);
    const expected = {
      "command": `generate.${pathId}.${scaffoldId}`,
      "group": "myextension.myGroup",
      "when": "razroo-vscode-plugin:isAuthenticated"
    };

    expect(result).toEqual(expected);
  });  
});

describe('createScaffoldCommand', () => {
  it('should create a scaffold command', () => {
    const pathId = 'angular-15.0.0';
    const scaffoldId = 'component';
    const result = createScaffoldCommand(pathId, scaffoldId);
    const expected = {
      "command": `generate.${pathId}.${scaffoldId}`,
      "title": "Angular Component"
    };

    expect(result).toEqual(expected);
   });
});

describe('buildScaffoldFunctionStatement', () => {
  it('should build the function statement for razroo', () => {
    const pathId = 'angular-15.0.0';
    const recipeId = 'angular-core';
    const scaffoldId = 'component';

    const result = buildScaffoldFunctionStatement(pathId, recipeId, scaffoldId);
    const expected = `return vscode.commands.registerCommand(
    generate.angular-15.0.0.angular-core,
      async ({path}) => createScaffold('angular-15.0.0', component, path, context, isProduction, angular-core, packageJsonParams)
    );
    `;
    expect(result).toEqual(expected);
  });
});