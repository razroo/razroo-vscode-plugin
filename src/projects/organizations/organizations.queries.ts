export const GetUserOrganizations = `
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
