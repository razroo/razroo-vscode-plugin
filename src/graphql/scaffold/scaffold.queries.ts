export const GetPathScaffolds = `
  query getPathScaffolds($pathOrgId: String!, $pathId: String!) {
    getPathScaffolds(pathOrgId: $pathOrgId, pathId: $pathId) {
      id
      recipeId 
      pathId
    }
  }
`;
