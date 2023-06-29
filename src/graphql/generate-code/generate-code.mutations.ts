export const GenerateVsCodeDownloadCode = `
  mutation generateVsCodeDownloadCode($generateVsCodeDownloadCodeParameters: GenerateCodeDownloadInput) {
    generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters: $generateVsCodeDownloadCodeParameters) {
      downloadUrl
      template {
        id
        title
        type
        recipeId
        pathId
        orgId
        updates
        filesToGenerate
        starter
        parameters {
          defaultValue
          description
          inputType
          name
          paramType
          type
          optionalTypes {
            name
            selected
          }
        }
        baseCommunityPath
      }
      runUnitTests
      runIntegrationTests
      vsCodeInstanceId
      parameters
    }
  }
`;
