/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

'use strict';

const path = require('path');
const merge = require('merge-options');
const webpack = require('webpack');
const { emitWarning } = require('process');

/**@type {import('webpack').Configuration}*/
module.exports =  function withDefaults(extConfig) {
    const defaultConfig = {
        mode: 'none',
        target: 'node', // vscode extensions run in webworker context for VS Code web 📖 -> https://webpack.js.org/configuration/target/#target
        entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
        output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
            path: path.resolve(__dirname, 'dist'),
            filename: 'extension.js',
            libraryTarget: "commonjs2",
            devtoolModuleFilenameTemplate: '../[resource-path]'
        },
        devtool: 'inline-source-map',
        node: {
          __dirname: false, // leave the __dirname behavior intact
        },
        externals: [
            {"vscode-extension-telemetry": 'commonjs vscode-extension-telemetry'}, // commonly used
            {vscode: "commonjs vscode"}, // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
            {axios: "axios"},
        ],
        resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
            mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
            preferRelative: true,
            extensions: ['.js', '.ts'],
            alias: {
              hexoid: 'hexoid/dist/index.js',
              semver: path.resolve(__dirname, "node_modules/semver")
            },
            fallback: {
              path: require.resolve('path-browserify'),
              fs: false,
              os: false,
              "fs.realpath": false,
              mkdirp: false,
              "dir-glob": false,
              "graceful-fs": false,
              "fast-glob": false,
              "source-map-support": false,
              "glob-parent": false,
              glob: false
              // Webpack 5 no longer polyfills Node.js core modules automatically.
              // see https://webpack.js.org/configuration/resolve/#resolvefallback
              // for the list of Node.js core module polyfills.
            }
        },
        module: {
            rules: [
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
                },
        ]
        },
        performance: {
          hints: "warning",
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: 'process/browser', // provide a shim for the global `process` variable
                window: 'global/window',
            }),
            new webpack.IgnorePlugin({
              resourceRegExp: /original-fs/,
              contextRegExp: /adm-zip/,
            }),
        ],
    };

    return defaultConfig;
};

