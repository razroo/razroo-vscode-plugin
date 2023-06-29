import { getStarterSteps } from '../src/starters/get-starter-steps.service';

const isProduction = true;

getStarterSteps(isProduction).then(starterSteps => {
  console.log('starterSteps');
  console.log(starterSteps);
});