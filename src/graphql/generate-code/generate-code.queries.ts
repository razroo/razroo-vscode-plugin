import gql from 'graphql-tag';

export const GenerateVsCodeDownloadCode = gql`
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
