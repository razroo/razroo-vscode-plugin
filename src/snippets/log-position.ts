import * as vscode from 'vscode';

export function logCursorPosition(selection: vscode.Selection) {
  const editor = vscode.window.activeTextEditor as any;
  const lineNumber = selection.active.line + 1;
  const columnNumber = selection.active.character + 1;
  const lineText = editor.document.lineAt(lineNumber - 1).text.trim();
  console.log(`Cursor position: line ${lineNumber}, column ${columnNumber}`);
  console.log(`lineText: ${lineText}`);
}