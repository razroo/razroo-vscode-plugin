import { COMMUNITY } from '../src/constants';
import { getPaths } from '../src/graphql/get-paths/paths.service';
// 1. getPaths - TODO modify this so 
// 2. loop throguh each path
// 3. get scaffolds of each path
// 4. build to package.json 
// 5. create separate command files for each programming language
// 6. import into extension.ts
const accessToken = process.env.accessToken as string;
const production = true;

getPaths(COMMUNITY, accessToken, production).then(paths => {
  console.log('paths');
  console.log(paths);
});
