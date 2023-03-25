import { PackageJson } from 'package-json-manager/dist/core/package-json';
import { coreProgrammingLanguagesMap } from "package-json-manager";

export async function determineLanguagesUsed(packageJson: PackageJson): Promise<string[]> {
    const languagesUsedArr = [] as any;
    const coreProgrammingLanguages = coreProgrammingLanguagesMap();
    // TODO
    for(const dependency in packageJson.dependencies) {
      if(coreProgrammingLanguages[dependency]) {
        languagesUsedArr.push(coreProgrammingLanguages[dependency]);
      }  
    }
  
    return languagesUsedArr;
  }