import * as vscode from 'vscode';
import AdmZip from 'adm-zip';
import { VSCODE_ACTIVE_COLUMN_NUMBER, VSCODE_ACTIVE_LINE_NUMBER, VSCODE_SNIPPET_LOADING } from '../constants';
import { codeSnippetGeneratedNotification } from './snippets-notifications';

export function writeCodeSnippet(context: vscode.ExtensionContext, zipEntry: AdmZip.IZipEntry, template: any, isProduction: boolean) {
  // Get the active text editor
  const editor = vscode.window.activeTextEditor as any;
  const snippetFileText = zipEntry.getData().toString("utf8");
  const lineNumber = context.workspaceState.get(VSCODE_ACTIVE_LINE_NUMBER) as number;
  const columnNumber = context.workspaceState.get(VSCODE_ACTIVE_COLUMN_NUMBER) as number;
  const indentedSnippetFileText = indentString(snippetFileText, columnNumber);
  const edit = new vscode.TextEdit(
    new vscode.Range(lineNumber, 0, lineNumber, 0),
    indentedSnippetFileText
  );
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(editor.document.uri, [edit]);
  vscode.workspace.applyEdit(workspaceEdit).then(data => {
    context.workspaceState.update(VSCODE_SNIPPET_LOADING, false);
  });
  codeSnippetGeneratedNotification(isProduction, template.orgId, template.pathId, template.recipeId, template.id);
}

function indentString(str: string, indentSize: number): string {
  const indentation = ' '.repeat(indentSize);
  const indentedString = indentation + str.replace(/\n/g, '\n' + indentation);
  if (indentedString.endsWith('\n')) {
    return indentedString;
  }
  return indentedString + '\n';
}