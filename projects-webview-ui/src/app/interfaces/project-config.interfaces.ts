export interface ProjectConfig {
  packageJsonParams?: any;
  versionControlParams?: VersionControlParams;
}

export interface VersionControlParams {
  gitOrigin: string;
  gitBranch: string;
  path: string;
}
