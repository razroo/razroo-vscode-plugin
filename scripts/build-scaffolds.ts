import { getPathScaffolds } from './../src/graphql/scaffold/scaffold.service';
import { COMMUNITY } from '../src/constants';
import { getPaths } from '../src/graphql/get-paths/paths.service';
import path from "path";
import dotenv from "dotenv";
import { buildScaffoldFunctionStatement, createScaffoldCommand, createScaffoldSubmenu } from '../src/utils/scaffold/scaffold';
import { readFileSync, writeFileSync } from 'fs';
import { getVersionAndNameString, morphCode } from '@razroo/razroo-codemod';
// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 1. getPaths - TODO modify this so 
// 2. loop through each path
// 3. get scaffolds of each path
// 4. build to package.json 
// 5. create separate command files for each programming language
// 6. import into extension.ts
const accessToken = process.env.accessToken as string;
const production = true;
const packageJson = readFileSync('package.json').toString();
import { camelCase } from 'lodash';
const pushCommandScaffoldsTs = readFileSync('src/utils/scaffold/push-scaffold-commands.ts').toString();

getPaths(COMMUNITY, accessToken, production).then(paths => {
  const scaffoldSubmenu = [] as any;
  const scaffoldCommands = [{
    command: "extension.auth0Authentication",
    title: "Razroo Auth0 Authentication"
  }] as any;
  const pushScaffoldCommandsEdits = [{
    nodeType: 'import',
    codeBlock: '{ createScaffold }',
    path: './scaffold'
  }] as any;
  const pushScafffoldCommands = [] as any;
  const angularPath = paths[0];
  getPathScaffolds(angularPath.orgId, angularPath.id, accessToken, production).then(scaffolds => {
    const pathId = getVersionAndNameString(angularPath.id);
    scaffolds.forEach(scaffold => {
      const camelCaseScaffoldId = camelCase(scaffold.id);
      const createScaffoldSubmenuItem = createScaffoldSubmenu(pathId.name, camelCaseScaffoldId);
      const createScaffoldCommandItem = createScaffoldCommand(pathId.name, camelCaseScaffoldId);
      scaffoldSubmenu.push(createScaffoldSubmenuItem);
      scaffoldCommands.push(createScaffoldCommandItem);
      const pushScaffoldFunctionStatement = buildScaffoldFunctionStatement(pathId.name, scaffold.id, scaffold.recipeId);
      const pushScaffoldCommandName = camelCase(`generate-${pathId.name}-${scaffold.id}`);
      pushScaffoldCommandsEdits.push({
        nodeType: 'addFunction',
        name: pushScaffoldCommandName,
        codeBlock: pushScaffoldFunctionStatement
      });
      pushScafffoldCommands.push(pushScaffoldCommandName);
    });

    const edits = [
      {
        nodeType: 'editJson',
        valueToModify: '/contributes/menus/scaffold.submenu',
        codeBlock: scaffoldSubmenu
      },
    ];
    
    const morphCodeEditJson = {
      fileType: 'json',
      fileToBeAddedTo: packageJson,
      edits: edits
    };

    // morph code so it has sub menu items needed
    const packageJsonFilePostEdits = morphCode(morphCodeEditJson);
    const scaffoldCommandEdits = [
      {
        nodeType: 'editJson',
        valueToModify: '/contributes/commands',
        codeBlock: scaffoldCommands
      },
    ];
    const scaffoldMorphCodeEditJson = {
      fileType: 'json',
      fileToBeAddedTo: packageJsonFilePostEdits,
      edits: scaffoldCommandEdits
    };

    // morph code so it has commands needed
    const packageJsonFilePostCommandEdits = morphCode(scaffoldMorphCodeEditJson);
    writeFileSync('package.json', packageJsonFilePostCommandEdits);

    // add appropriate functions for push scaffold commands
    const pushScaffoldCommandsEditJson = {
      fileType: 'ts',
      fileToBeAddedTo: pushCommandScaffoldsTs,
      edits: pushScaffoldCommandsEdits
    };
    // morph code so it has commands needed
    const pushCommandScaffoldsTsEdits = morphCode(pushScaffoldCommandsEditJson);
    writeFileSync('src/utils/scaffold/push-scaffold-commands.ts', pushCommandScaffoldsTsEdits);
  });

  
});
