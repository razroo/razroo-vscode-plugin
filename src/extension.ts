// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fileSystem = require('fs');
import path = require('path');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
		console.log("DirName", __dirname);
		console.log("FileName", __filename);
		vscode.window.showInformationMessage('Thanks for using the Razroo VSCode Plugin. It will help you write production code easier and faster.');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
