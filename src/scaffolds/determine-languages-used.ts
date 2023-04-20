import { coreProgrammingLanguagesMap } from "package-json-manager";

export async function determineLanguagesUsed(packageJson: any): Promise<string[]> {
    const languagesUsedArr = [] as any;
    const coreProgrammingLanguages = coreProgrammingLanguagesMap();
    for(const dependency in packageJson.dependencies) {
      if(coreProgrammingLanguages[dependency]) {
        languagesUsedArr.push(coreProgrammingLanguages[dependency]);
      }  
    }
    for(const devDependency in packageJson.devDependencies) {
      if(coreProgrammingLanguages[devDependency]) {
        languagesUsedArr.push(coreProgrammingLanguages[devDependency]);
      }  
    }
  
    return languagesUsedArr;
  }