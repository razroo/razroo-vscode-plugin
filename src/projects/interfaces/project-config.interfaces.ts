export interface ProjectConfig {
  packageJsonParams?: any;
  versionControlParams: VersionControlParams;
  folderName: string;
  rootPath: string;
}

export interface VersionControlParams {
  gitOrigin: string;
  gitBranch: string;
  path: string;
}