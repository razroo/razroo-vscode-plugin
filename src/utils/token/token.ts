import { VersionControlParams } from './../../projects/interfaces/project-config.interfaces';
import { EMPTY } from './../../constants';
import { extractProjectName } from '@codemorph/core';
import { kebabCase } from 'lodash';

export function createVSCodeIdToken(userId: string, orgId: string, versionControlParams: VersionControlParams, packageJsonParams: any) {
  const gitOrigin = versionControlParams.gitOrigin;
  if(!gitOrigin) {
    if(userId === orgId) {
      return packageJsonParams.name ? `${userId}_${kebabCase(packageJsonParams.name)}` : EMPTY;
    } else {
      return EMPTY;
    }
  } else {
    return `${userId}_${extractProjectName(gitOrigin)}`;
  }
}