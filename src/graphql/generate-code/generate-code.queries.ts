export const GenerateVsCodeDownloadCode = `
  query generateVsCodeDownloadCode($generateVsCodeDownloadCodeParameters: GenerateCodeDownloadInput) {
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
