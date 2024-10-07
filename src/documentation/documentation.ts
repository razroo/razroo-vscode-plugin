import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

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
        // Find the git root directory
        const { stdout: gitRoot } = await execAsync('git rev-parse --show-toplevel', { cwd: path.dirname(filePath) });
        const gitRootPath = gitRoot.trim();

        // Get relative path of the file from git root
        const relativeFilePath = path.relative(gitRootPath, filePath);

        // Get Git blame information
        const { stdout: blameOutput } = await execAsync(`git blame -L ${lineNumber},${lineNumber} "${relativeFilePath}"`, { cwd: gitRootPath });
        const commitHash = blameOutput.split(' ')[0];
        // Get commit details
        const { stdout: commitDetails } = await execAsync(`git show --format="%B" -s ${commitHash}`, { cwd: gitRootPath });
        console.log('commitDetails', commitDetails);
        
        // Extract URL from commit message
        const urlMatch = commitDetails.match(/razroo\.com\S+/);
        console.log('urlMatch', urlMatch);
        if (!urlMatch) {
            vscode.window.showInformationMessage('No Razroo URL found in the commit message.');
            return;
        }

        const url = urlMatch[0].replace(/\]$/, '');

        console.log('url', url);

        // Open URL in default browser
        vscode.env.openExternal(vscode.Uri.parse(`https://${url}`)).then(() => {
            vscode.window.showInformationMessage(`Opened ${url} in your default browser.`);
        }, (error) => {
            vscode.window.showErrorMessage(`Failed to open ${url}: ${error}`);
        });

    } catch (error: any) {
        if (error.message.includes('not a git repository')) {
            vscode.window.showErrorMessage('The current file is not in a Git repository.');
        } else {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    }
}