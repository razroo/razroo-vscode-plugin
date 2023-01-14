import { getPathScaffolds } from './../src/graphql/scaffold/scaffold.service';
import { COMMUNITY } from '../src/constants';
import { getPaths } from '../src/graphql/get-paths/paths.service';
import path from "path";
import dotenv from "dotenv";
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

getPaths(COMMUNITY, accessToken, production).then(paths => {
  const angularPath = paths[0];
  console.log('angularPath');
  console.log(angularPath);
  getPathScaffolds(angularPath.orgId, angularPath.id, accessToken, production).then(scaffolds => {
    console.log('scaffolds');
    console.log(scaffolds);
  });
});
