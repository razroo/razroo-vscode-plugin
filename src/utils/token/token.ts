import { VersionControlParams } from './../../projects/interfaces/project-config.interfaces';
import { EMPTY } from './../../constants';
import { extractProjectName } from '@codemorph/core';

export function createVSCodeIdToken(userId: string, versionControlParams: VersionControlParams) {
  const gitOrigin = versionControlParams.gitOrigin;
  return gitOrigin ? `${userId}_${extractProjectName(gitOrigin)}` : EMPTY;
}