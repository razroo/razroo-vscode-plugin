import { MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_ORG_ID } from '../constants';
import * as vscode from 'vscode';
import { getSnippetTemplates } from './snippets.queries';

export async function logCursorPosition(context: vscode.ExtensionContext, selection: vscode.Selection, 
    isProduction: boolean) {
  const accessToken = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN) as string;      
  const orgId = context.workspaceState.get(MEMENTO_RAZROO_ORG_ID);
  const vsCodeToken = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  const path = vsCodeToken ? (vsCodeToken as any).split('_').pop() : '';
  const editor = vscode.window.activeTextEditor as any;
  const lineNumber = selection.active.line + 1;
  const columnNumber = selection.active.character + 1;
  const searchText = editor.document.lineAt(lineNumber - 1).text.trim();
  if (isComment(searchText)) {
    if(!orgId) {
      return;
    }
    const snippetOptions = await getSnippetTemplates(searchText, orgId as string, path, isProduction, accessToken);
    console.log('snippetOptions');
    console.log(snippetOptions);
    const selectedOption = await vscode.window.showQuickPick(snippetOptions);
    if (selectedOption) {
        vscode.window.showInformationMessage(`You selected ${selectedOption}`);
    }
    console.log(`Cursor position: line ${lineNumber}, column ${columnNumber}`);
    console.log(`lineText: ${searchText}`);
  }
}

function isComment(lineText: string): boolean {
  // Regex pattern to match comment styles across different programming languages\
  // for JavaScript, # for Python, /* for Java, <!-- for HTML,
  const commentRegex = /^(\s*\/\/)|(^#)|(^\/\*)|(^<!--)/;
  return commentRegex.test(lineText);
}