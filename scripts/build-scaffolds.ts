import { getPathScaffolds } from './../src/graphql/scaffold/scaffold.service';
import { COMMUNITY } from '../src/constants';
import { getPaths } from '../src/graphql/get-paths/paths.service';
import path from "path";
import dotenv from "dotenv";
import { createScaffoldSubmenu } from '../src/utils/scaffold/scaffold';
import { readFileSync } from 'fs';
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
  const angularPath = paths[0];
  console.log('angularPath');
  console.log(angularPath);
  getPathScaffolds(angularPath.orgId, angularPath.id, accessToken, production).then(scaffolds => {
    scaffolds.forEach(scaffold => {
      const createScaffoldSubmenuItem = createScaffoldSubmenu(scaffold.pathId, scaffold.id);
      scaffoldSubmenu.push(createScaffoldSubmenuItem);
    });

    const edits = [
      {
        nodeType: 'addJsonKeyValue',
        valueToModify: 'scaffold.submenu',
        codeBlock: scaffoldSubmenu
      }
    ];
    const morphCodeEditJson = {
      fileType: 'json',
      fileToBeAddedTo: packageJson,
      edits: edits
    };

    const packageJsonFilePostEdits = morphCode(morphCodeEditJson);
    console.log('packageJsonFilePostEdits');
    console.log(packageJsonFilePostEdits);
  });

  
});
