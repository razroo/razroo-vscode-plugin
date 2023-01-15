import { getPathScaffolds } from './../src/graphql/scaffold/scaffold.service';
import { COMMUNITY } from '../src/constants';
import { getPaths } from '../src/graphql/get-paths/paths.service';
import path from "path";
import dotenv from "dotenv";
import { createScaffoldCommand, createScaffoldSubmenu } from '../src/utils/scaffold/scaffold';
import { readFileSync, writeFileSync } from 'fs';
import { morphCode } from '@razroo/razroo-codemod';
// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 1. getPaths - TODO modify this so 
// 2. loop throguh each path
// 3. get scaffolds of each path
// 4. build to package.json 
// 5. create separate command files for each programming language
// 6. import into extension.ts
const accessToken = process.env.accessToken as string;
const production = true;
const packageJson = readFileSync('package.json').toString();

getPaths(COMMUNITY, accessToken, production).then(paths => {
  const scaffoldSubmenu = [] as any;
  const scaffoldCommands = [{
    command: "extension.auth0Authentication",
    title: "Razroo Auth0 Authentication"
  }] as any;
  const angularPath = paths[0];
  getPathScaffolds(angularPath.orgId, angularPath.id, accessToken, production).then(scaffolds => {
    scaffolds.forEach(scaffold => {
      const createScaffoldSubmenuItem = createScaffoldSubmenu(scaffold.pathId, scaffold.id);
      const createScaffoldCommandItem = createScaffoldCommand(scaffold.pathId, scaffold.id);
      scaffoldSubmenu.push(createScaffoldSubmenuItem);
      scaffoldCommands.push(createScaffoldCommandItem);
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
    const packageJsonFilePostCommandEdits = morphCode(scaffoldMorphCodeEditJson);
    writeFileSync('package.json', packageJsonFilePostCommandEdits);
  });

  
});
