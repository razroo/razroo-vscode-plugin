export const GenerateVsCodeDownloadCode = `
  mutation generateVsCodeDownloadCode($generateVsCodeDownloadCodeParameters: GenerateCodeDownloadInput) {
    generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters: $generateVsCodeDownloadCodeParameters) {
      downloadUrl
      template {
        id
        title
        type
      }
    }
  }
`;
