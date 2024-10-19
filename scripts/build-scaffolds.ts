

import { getPathScaffolds } from './../src/graphql/scaffold/scaffold.service';
import { COMMUNITY } from '../src/constants';
import { getPaths } from '../src/graphql/get-paths/paths.service';
import path from "path";
import dotenv from "dotenv";
import { buildPushScaffoldCommandsStatement, buildScaffoldFunctionStatement, createScaffoldCommand, createScaffoldSubmenu } from '../src/utils/scaffold/scaffold';
import { readFileSync, writeFileSync } from 'fs';
import { getVersionAndNameString, morphCode } from '@codemorph/core';
import { camelCase } from 'lodash';
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
const pushCommandScaffoldsTs = '';

getPaths(COMMUNITY, accessToken, production).then(async paths => {
  console.log('paths');
  console.log(paths);
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
  const getPathScaffoldsPromises = paths.map(async (path) => {
    return await getPathScaffolds(path.orgId, path.id, accessToken, production);
  });

  // wait for all promises to resolve
  const allScaffolds = await Promise.all(getPathScaffoldsPromises);

  console.log('allScaffolds');
  console.log(allScaffolds);

  allScaffolds.forEach(async (scaffolds, index, arr) => {
      scaffolds && await scaffolds.forEach(scaffold => {
        const fullVersionedPathId = scaffold.pathId;
        const pathId = getVersionAndNameString(scaffold.pathId);
        const camelCaseScaffoldId = camelCase(scaffold.id);
        const createScaffoldSubmenuItem = createScaffoldSubmenu(pathId.name, camelCaseScaffoldId);
        const createScaffoldCommandItem = createScaffoldCommand(pathId.name, camelCaseScaffoldId);
        scaffoldSubmenu.push(createScaffoldSubmenuItem);
        scaffoldCommands.push(createScaffoldCommandItem);
        const pushScaffoldFunctionStatement = buildScaffoldFunctionStatement(fullVersionedPathId, scaffold.id, scaffold.recipeId);
        const pushScaffoldCommandName = camelCase(`generate-${pathId.name}-${scaffold.id}`);
        pushScaffoldCommandsEdits.push({
          nodeType: 'addFunction',
          name: pushScaffoldCommandName,
          parameters: [{name: 'vscode'}, {name: 'context'}, {name: 'isProduction'}],
          codeBlock: pushScaffoldFunctionStatement
        });
        pushScafffoldCommands.push(`${pushScaffoldCommandName}(vscode, context, isProduction)`);
      });
  
    if(index === arr.length - 1) {
      writeCodemods();
    }  
  });

  function writeCodemods() {
    // add appropriate functions for push scaffold commands
    // first will add global function to edits 
    const builtPushScaffoldCommandsStatement = buildPushScaffoldCommandsStatement(pushScafffoldCommands);
    pushScaffoldCommandsEdits.push({
      nodeType: 'addFunction',
      name: 'pushScaffoldCommands',
      isExported: true,
      parameters: [{name: 'context'}, {name: 'vscode'}, {name: 'isProduction', type: 'boolean'}],
      codeBlock: builtPushScaffoldCommandsStatement
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
  
    // next formulate all edits
    const pushScaffoldCommandsEditJson = {
      fileType: 'ts',
      fileToBeAddedTo: pushCommandScaffoldsTs,
      edits: pushScaffoldCommandsEdits
    };
    // morph code so it has commands needed
    const pushCommandScaffoldsTsEdits = morphCode(pushScaffoldCommandsEditJson);
    writeFileSync('src/utils/scaffold/push-scaffold-commands.ts', pushCommandScaffoldsTsEdits);
  }
  
});
