import { VersionControlParams } from './../../projects/interfaces/project-config.interfaces';
import { EMPTY } from './../../constants';
import { extractProjectName } from '@codemorph/core';
import { kebabCase } from 'lodash';

export function createVSCodeIdToken(userId: string, orgId: string, versionControlParams: VersionControlParams, packageJsonParams: any, folderName: string) {
  const gitOrigin = versionControlParams.gitOrigin;
  if(!gitOrigin) {
    if(userId === orgId) {
      if(packageJsonParams && packageJsonParams.name) {
        return `${userId}_${kebabCase(packageJsonParams.name)}`;
      } else if(folderName) {
        return `${userId}_${kebabCase(folderName)}`;
      } else {
        return EMPTY;
      }
    } else {
      return EMPTY;
    }
  } else {
    return `${userId}_${extractProjectName(gitOrigin)}`;
  }
}