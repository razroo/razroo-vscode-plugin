import gql from 'graphql-tag';

export const GetPathScaffolds = gql`
  query getPathScaffolds(pathOrgId: String!, pathId: String!) {
    getPathScaffolds(pathOrgId: $pathOrgId, pathId: $pathId) {
      id
      recipeId 
      pathId
    }
  }
`;
