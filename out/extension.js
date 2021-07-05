"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const credentials_1 = require("./credentials");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const credentials = new credentials_1.Credentials();
        yield credentials.initialize(context);
        // Use the console to output diagnostic information (console.log) and errors (console.error)
        // This line of code will only be executed once when your extension is activated
        console.log('Congratulations, your extension "razroo-vscode-plugin" is now active!');
        console.log(__dirname);
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('razroo-vscode-plugin.initialization', () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            console.log('DirName', __dirname);
            console.log('FileName', __filename);
            vscode.window.showInformationMessage('Thanks for using the Razroo VSCode Plugin. It will help you write production code easier and faster.');
        });
        context.subscriptions.push(disposable);
        context.subscriptions.push(vscode.commands.registerCommand('razroo-vscode-plugin.authenticate', () => {
            // Create and show a new webview
            const panel = vscode.window.createWebviewPanel('catCoding', // Identifies the type of the webview. Used internally
            'Razroo Authentication', // Title of the panel displayed to the user
            vscode.ViewColumn.Active, // Editor column to show the new webview panel in.
            {
                // Enable scripts in the webview
                enableScripts: true,
            });
            panel.webview.html = getWebviewContent();
        }));
        // GitHub Authentication
        const githubDisposable = vscode.commands.registerCommand('extension.getGitHubUser', () => __awaiter(this, void 0, void 0, function* () {
            console.log("inside getGitHubUser");
            /**
             * Octokit (https://github.com/octokit/rest.js#readme) is a library for making REST API
             * calls to GitHub. It provides convenient typings that can be helpful for using the API.
             *
             * Documentation on GitHub's REST API can be found here: https://docs.github.com/en/rest
             */
            const octokit = yield credentials.getOctokit();
            console.log("octokit", octokit);
            const userInfo = yield octokit.users.getAuthenticated();
            console.log("userInfo", userInfo);
            vscode.window.showInformationMessage(`Logged into GitHub as ${userInfo.data.login}`);
        }));
        context.subscriptions.push(githubDisposable);
    });
}
exports.activate = activate;
function getWebviewContent() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  </head>
  <body>
  <iframe src="https://zeta.razroo.com/">
  </iframe>
  </body>
  </html>`;
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map