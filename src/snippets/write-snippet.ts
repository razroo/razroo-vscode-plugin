import * as vscode from 'vscode';
import AdmZip from 'adm-zip';
import { VSCODE_ACTIVE_LINE_NUMBER } from '../constants';

export function writeCodeSnippet(context: vscode.ExtensionContext, zipEntry: AdmZip.IZipEntry) {
  // Get the active text editor
  const editor = vscode.window.activeTextEditor as any;
  const snippetFileText = zipEntry.getData().toString("utf8");
  const lineNumber = context.workspaceState.get(VSCODE_ACTIVE_LINE_NUMBER) as number;
  const edit = new vscode.TextEdit(
    new vscode.Range(lineNumber, 0, lineNumber, 0),
    snippetFileText
  );
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(editor.document.uri, [edit]);
  vscode.workspace.applyEdit(workspaceEdit);
}