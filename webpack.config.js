/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

'use strict';

const path = require('path');
const ResolveTypescriptPlugin = require('resolve-typescript-plugin');

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'webworker', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    mode: 'none',
    entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    externalsPresets: { node: true },
    devtool: 'source-map',
    externals: {
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        symlinks: false,
        // fallback: { "crypto": require.resolve("crypto-browserify") },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs', '.wasm', '.json'],
        plugins: [
            new ResolveTypescriptPlugin({
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
                test: /\.m?jsx?$/,
                resolve: {
                    fullySpecified: false
                }
            },
            {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader',
                options: {
                    compilerOptions: {
                        "module": "es6" // override `tsconfig.json` so that TypeScript emits native JavaScript modules.
                    }
                }
            }]
        }]
    },
};

module.exports = config;