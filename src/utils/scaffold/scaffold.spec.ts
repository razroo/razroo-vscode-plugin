import { createScaffoldSubmenu } from "./scaffold";

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