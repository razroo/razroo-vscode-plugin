import { createVSCodeIdToken } from "./token";

describe('createVSCodeIdToken',() => {
  it('should extract id token as expected given git origin', () => {
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

    const result = createVSCodeIdToken(userId, orgId, versionControlParams, packageJsonParams);
    const expected = 'chill-mcchill-123_razroo_razroo-vscode-plugin';
    expect(result).toEqual(expected);
  });
});