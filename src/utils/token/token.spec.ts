import { createVSCodeIdToken } from "./token";

describe('createVSCodeIdToken',() => {
  const versionControlParams = {
    gitOrigin: 'git@github.com:razroo/razroo-vscode-plugin.git',
    gitBranch: 'test-branch',
    path: 'user/chill'
  };
  const packageJsonParams = {
    name: 'razroo-angular-starter'
  };
  const userId = 'chill-mcchill-123';
  const orgId = 'chill-mcchill-123';
  const folderName = 'razroo-angular-starter-test';
  it('should extract id token as expected given git origin', () => {
    const result = createVSCodeIdToken(userId, orgId, versionControlParams, packageJsonParams, folderName);
    const expected = 'chill-mcchill-123_razroo_razroo-vscode-plugin';
    expect(result).toEqual(expected);
  });

  it('should return personal workspace token if personal workspace but no git origin', () => {
    const versionControlParamsAlt = {} as any;
    const result = createVSCodeIdToken(userId, orgId, versionControlParamsAlt, packageJsonParams, folderName);
    const expected = 'chill-mcchill-123_razroo-angular-starter';
    expect(result).toEqual(expected);
  });

  it('should return personal workspace token if personal workspace but no git origin and package json params but yes folder name', () => {
    const versionControlParamsAlt = {} as any;
    const packageJsonParams = undefined as any;
    const result = createVSCodeIdToken(userId, orgId, versionControlParamsAlt, packageJsonParams, folderName);
    const expected = 'chill-mcchill-123_razroo-angular-starter-test';
    expect(result).toEqual(expected);
  });

  it('should return EMPTY if not personal workspace and not git origin and no folderName', () => {
    const versionControlParamsAlt = {} as any;
    const orgIdAlt = 'razroo';
    const folderNameAlt = undefined;
    const result = createVSCodeIdToken(userId, orgIdAlt, versionControlParamsAlt, packageJsonParams, folderNameAlt);
    const expected = 'EMPTY';
    expect(result).toEqual(expected);
  });
});