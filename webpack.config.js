//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const ResolveTypeScriptPlugin = require("resolve-typescript-plugin");

/**@type {import('webpack').Configuration}*/
/* eslint @typescript-eslint/no-var-requires: "off" */
module.exports = {
  mode: 'none',
  target: 'webworker', // vscode extensions run in webworker context for VS Code web 📖 -> https://webpack.js.org/configuration/target/#target
  externalsPresets: { node: true },
  externals: [
    nodeExternals(),
    {vscode: 'commonjs vscode'}, // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/}
  ],
  devtool: 'source-map',
  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  node: false,
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
    extensions: ['.js'],
    alias: {
      // provides alternate implementation for node module and source files
    },
    preferRelative: true,
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
    },
    plugins: [new ResolveTypeScriptPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.node/,
        use: [
          {
            loader: 'url-loader'
          }
        ]
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader"
      }
    ]
  },
  performance: {
		hints: false,
	},
  plugins: [
		new webpack.ProvidePlugin({
			process: 'process/browser', // provide a shim for the global `process` variable
		}),
	],
  
};