export interface ProjectConfig {
  packageJsonParams?: any;
  versionControlParams?: any;
}

export interface versionControlParams {
  gitOrigin: string;
  gitBranch: string;
}