//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

/**@type {import('webpack').Configuration}*/
/* eslint @typescript-eslint/no-var-requires: "off" */

const config = {
  mode: 'none',
  target: 'webworker', // vscode extensions run in webworker context for VS Code web 📖 -> https://webpack.js.org/configuration/target/#target
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
  externalsPresets: { node: true },
  externals: [
    {vscode: 'commonjs vscode'}, // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/}
    nodeExternals({
      allowlist: ["@aws-sdk/signature-v4-crt",
      "adm-zip",
      "apollo-cache-inmemory",
      "apollo-client",
      "auth0",
      "aws-appsync",
      "aws-sdk",
      "axios",
      "child_process",
      "child_process",
      "cookiejar",
      "es6-promise",
      "file-system",
      "follow-redirects",
      "formidable",
      "graphql",
      "graphql-tag",
      "extend",
      "isomorphic-fetch",
      "jwt-decode",
      "lru-memoizer",
      "mime",
      "mocha",
      "open",
      "path",
      "performance-now",
      "psl",
      "prettier",
      "process/browser",
      "punycode",
      "qs",
      "querystring",
      "safe-butter",
      "setimmediate",
      "redux-persist/lib/constants",
      "redux",
      "redux-thunk",
      "request",
      "rest-facade",
      "retry",
      "tough-cookie",
      "subscriptions-transport-ws",
      "superagent-proxy",
      "tunnel-agent",
      "uuid",
      "url",
      "util",
      "ws",
      "zlib"]
    })
  ],  
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
    extensions: ['.ts', '.js'],
    alias: {
      // provides alternate implementation for node module and source files
    },
    preferRelative: true,
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
    }
  },
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
            fullySpecified: false
        }
      },
      {
        test: /\.node/,
        use: [
          {
            loader: 'url-loader'
          }
        ]
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                  "module": "es6" // override `tsconfig.json` so that TypeScript emits native JavaScript modules.
              }
            }
          },
        ]
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
module.exports = config;