import { writeFileSync } from 'fs';
import { getStarterSteps } from '../src/starters/get-starter-steps.service';

const isProduction = true;

getStarterSteps(isProduction).then(starterSteps => {
  const stringToInject = `export const starterSteps = ${JSON.stringify(starterSteps)};`;
  writeFileSync('projects-webview-ui/src/app/data/starter-steps.ts', stringToInject);
});