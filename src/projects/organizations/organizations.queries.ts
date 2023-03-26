import gql from 'graphql-tag';

export const GetUserOrganizations = gql`
  query GetUserOrganizations($userId: ID!) {
    userOrganizations(userId: $userId) {
      displayName
      isActive
      orgId
      picture
      userId
    }
  }
`;
