//@ts-check
'use strict';

const path = require('path');
const webpack = require('webpack');

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
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    mainFields: ['module', 'main'], // look for `browser` entry point in imported node modules
    extensions: ['.js', '.mjs'],
    preferRelative: true,
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
    },
    plugins: [],
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