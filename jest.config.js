/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: './vscode-environment.js',
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    vscode: path.join(__dirname, 'test-jest', 'vscode.js')  // <----- most important line
  },
};