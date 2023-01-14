export const GetPaths = `
  query getPaths($orgId: String!, $pathsType: PathsType){
    getPaths(orgId: $orgId, pathsType: $pathsType){
      id
      orgId
    }
  }
`;
