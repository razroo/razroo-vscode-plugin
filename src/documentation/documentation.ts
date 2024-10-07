import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getGitHistoryAndNavigateToRazrooUrl() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const filePath = document.uri.fsPath;
    const lineNumber = editor.selection.active.line + 1;

    try {
        // Get Git blame information
        const { stdout: blameOutput } = await execAsync(`git blame -L ${lineNumber},${lineNumber} "${filePath}"`);
        const commitHash = blameOutput.split(' ')[0];

        // Get commit details
        const { stdout: commitDetails } = await execAsync(`git show --format="%B" -s ${commitHash}`);
        
        // Extract URL from commit message
        const urlMatch = commitDetails.match(/https?:\/\/razroo\.com\S+/);
        if (!urlMatch) {
            vscode.window.showInformationMessage('No Razroo URL found in the commit message.');
            return;
        }

        const url = urlMatch[0];

        // Open URL in default browser
        vscode.env.openExternal(vscode.Uri.parse(url));

    } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
}