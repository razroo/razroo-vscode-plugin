export const mockVSCode = {
    window: {
      showInformationMessage: () => {},
      showErrorMessage: () => {},
    },
    commands: {
      executeCommand: () => Promise.resolve(),
    },
    // Add other vscode APIs that your script might use
  };