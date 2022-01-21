//@ts-check

const esModules = ['parse5', 'vfile', 'vfile-location', 'to-vfile', 'hastscript', 'property-information',
'unist-util-stringify-position', 'unist-util-inspect', 'hast-util-from-parse5', 
'hast-util-parse-selector', 'space-separated-tokens', 'comma-separated-tokens',
'web-namespaces', 'unist-util-visit', 'unist-util-is', 'hast-util-from-dom', 
'unist-util-map', 'hast-util-to-dom', 'hast-util-raw', 'unist-util-position', 
'hast-util-to-parse5', 'hast-to-hyperscript', 'zwitch', 'html-void-elements',
'hast-util-to-html', 'hast-util-is-element', 'hast-util-whitespace', 'stringify-entities',
'character-entities-legacy', 'character-entities-html4', 'ccount', '@razroo/razroo-devkit',
'unist-util-visit-parents'];

const esModulesAliases = {
  'parse5': 'parse5',
  'vfile': 'vfile', 
  'vfile-location': 'vfile-location', 
  'to-vfile': 'to-vfile', 
  'hastscript': 'hastscript', 
  'property-information': 'property-information',
  'unist-util-stringify-position': 'unist-util-stringify-position', 
  'unist-util-inspect': 'unist-util-inspect', 
  'hast-util-from-parse5': 'hast-util-from-parse5', 
  'hast-util-parse-selector': 'hast-util-parse-selector',
  'space-separated-tokens': 'space-separated-tokens', 
  'comma-separated-tokens': 'comma-separated-tokens',
  'web-namespaces': 'web-namespaces', 
  'unist-util-visit': 'unist-util-visit', 
  'unist-util-is': 'unist-util-is', 
  'hast-util-from-dom': 'hast-util-from-dom', 
  'unist-util-map': 'unist-util-map', 
  'hast-util-to-dom': 'hast-util-to-dom', 
  'hast-util-raw': 'hast-util-raw', 
  'unist-util-position': 'unist-util-position', 
  'hast-util-to-parse5': 'hast-util-to-parse5', 
  'hast-to-hyperscript': 'hast-to-hyperscript', 
  'zwitch': 'zwitch', 
  'html-void-elements': 'html-void-elements',
  'hast-util-to-html': 'hast-util-to-html', 
  'hast-util-is-element': 'hast-util-is-element', 
  'hast-util-whitespace': 'hast-util-whitespace', 
  'stringify-entities': 'stringify-entities',
  'character-entities-legacy': 'character-entities-legacy', 
  'character-entities-html4': 'character-entities-html4', 
  'ccount': 'ccount', 
  '@razroo/razroo-devkit': '@razroo/razroo-devkit',
  'unist-util-visit-parents': 'unist-util-visit-parents'
};

'use strict';

const path = require('path');
const webpack = require('webpack');
const ResolveTypeScriptPlugin = require("resolve-typescript-plugin");
const nodeExternals = require('webpack-node-externals');
const { emitWarning } = require('process');

module.exports = {
  mode: 'none',
  target: 'webworker', // vscode extensions run in webworker context for VS Code web 📖 -> https://webpack.js.org/configuration/target/#target
  externalsPresets: { node: true },
  externals: [
    nodeExternals({
      allowlist: esModules
    }),
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
    mainFields: ['module', 'main'], // look for `browser` entry point in imported node modules
    extensions: ['.js', '.mjs'],
    alias: esModulesAliases,
    preferRelative: true,
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
    },
    plugins: [
      new ResolveTypeScriptPlugin({
        includeNodeModules: false
      }),
    ],
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
        test: /\.ts$/,
        use: "ts-loader"
      },
      {
        test: /\.m?js/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
            sourceType: "unambiguous",
          },
        }
      },
    ]
  },
  performance: {
		hints: "warning",
	},
  plugins: [
		new webpack.ProvidePlugin({
			process: 'process/browser', // provide a shim for the global `process` variable
		}),
	],
  
};