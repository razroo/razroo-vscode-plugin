export interface GenerateCodeParameters {
    customInsertPath?: string;
    parameters?: string;
    userOrgId: string;
    userId: string;
    pathOrgId: string;
    projectName: string;
    stepId: string;
    runUnitTests?: boolean;
    runIntegrationTests?: boolean;
    recipeId: string;
    pathId: string;
    vsCodeInstanceId?: string;
}
  