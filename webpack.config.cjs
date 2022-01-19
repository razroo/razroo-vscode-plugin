//@ts-check

const esModules = ['parse5', 'vfile', 'to-vfile', 'hastscript', 'property-information',
'unist-util-stringify-position', 'unist-util-inspect', 'hast-util-from-parse5', 
'hast-util-parse-selector', 'space-separated-tokens', 'comma-separated-tokens',
'web-namespaces', 'unist-util-visit', 'unist-util-is', 'hast-util-from-dom', 
'unist-util-map', 'hast-util-to-dom', 'hast-util-raw', 'unist-util-position', 
'hast-util-to-parse5', 'hast-to-hyperscript', 'zwitch', 'html-void-elements',
'hast-util-to-html', 'hast-util-is-element', 'hast-util-whitespace', 'stringify-entities',
'character-entities-legacy', 'character-entities-html4', 'ccount'];

'use strict';

const path = require('path');
const webpack = require('webpack');
const ResolveTypeScriptPlugin = require("resolve-typescript-plugin");
const nodeExternals = require('webpack-node-externals');

/**@type {import('webpack').Configuration}*/
/* eslint @typescript-eslint/no-var-requires: "off" */
module.exports = {
  mode: 'none',
  target: 'webworker', // vscode extensions run in webworker context for VS Code web 📖 -> https://webpack.js.org/configuration/target/#target
  externalsPresets: { node: true },
  externals: [
    {vscode: 'commonjs vscode'}, // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/}
  ],
  devtool: 'source-map',
  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  node: false,
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.cjs',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    mainFields: ['module', 'main'], // look for `browser` entry point in imported node modules
    extensions: ['.ts', '.js', '.mjs'],
    alias: {
      // provides alternate implementation for node module and source files
    },
    preferRelative: true,
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
    },
    plugins: [new ResolveTypeScriptPlugin({
      includeNodeModules: false
    })],
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
        test: /\.m?js/,
        exclude: [
          /node_modules\/(?!graphql).*/
        ],
        resolve: {
            fullySpecified: false
        }
      },
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: "ts-loader"
      },
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