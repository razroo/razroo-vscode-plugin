import { MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_ORG_ID, MEMENTO_RAZROO_USER_ID, VSCODE_ACTIVE_COLUMN_NUMBER, VSCODE_ACTIVE_LINE_NUMBER, VSCODE_SNIPPET_LOADING } from '../constants';
import * as vscode from 'vscode';
import { getSnippetTemplates } from './snippets.queries';
import { generateVsCodeDownloadCode } from '../graphql/generate-code/generate-code.service';
import { codeSnippetGeneratingNotification } from './snippets-notifications';

export async function logCursorPosition(context: vscode.ExtensionContext, selection: vscode.Selection, 
    isProduction: boolean) {
  const accessToken = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN) as string;      
  const orgId = context.workspaceState.get(MEMENTO_RAZROO_ORG_ID);
  const vsCodeToken = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  const path = vsCodeToken ? (vsCodeToken as any).split('_').pop() + '-0.0.0' : '';
  if(!path) {
    return;
  }
  const editor = vscode.window.activeTextEditor as any;
  const lineNumber = selection.active.line + 1;
  const columnNumber = selection.active.character + 1;
  const codeLine = editor.document.lineAt(lineNumber - 1);
  const searchText = codeLine.text.trim();
  const codeIndentationColumn = codeLine.firstNonWhitespaceCharacterIndex;
  if (isComment(searchText)) {
    if(!orgId) {
      return;
    }
    context.workspaceState.update(VSCODE_ACTIVE_LINE_NUMBER, lineNumber);
    context.workspaceState.update(VSCODE_ACTIVE_COLUMN_NUMBER, codeIndentationColumn);
    
    const snippetOptions = await getSnippetTemplates(searchText, orgId as string, path, isProduction, accessToken);
    const quickPickOptions: vscode.QuickPickItem[] = await snippetOptions ? snippetOptions.map(snippetOption => {
      return {
        orgId: snippetOption.orgId,
        pathId: snippetOption.pathId,
        recipeId: snippetOption.recipeId,
        id: snippetOption.id,
        label: snippetOption.title,
        detail: snippetOption.instructionalContent
      };
    }) : [];
    const selectedOption = await vscode.window.showQuickPick(quickPickOptions, {
      title: 'Choose A Code Snippet'
    });
    if (selectedOption) {
      // state here used to freeze logging until snippet has loaded
      context.workspaceState.update(VSCODE_SNIPPET_LOADING, true);
      vscode.window.showInputBox({
          prompt: `Name for ${selectedOption?.label}?`, // Set the prompt text
          placeHolder: 'user'  // Set the placeholder text
      }).then(customName => {
        // Do something with the custom name
        codeSnippetGeneratingNotification();
        const generateVsCodeDownloadCodeParameters = createGenerateVsCodeDownloadCodeParameters(context, (selectedOption as any).orgId as string, (selectedOption as any).pathId, (selectedOption as any).recipeId, (selectedOption as any).id, customName as string);
        generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters, context, isProduction).then(data => {
        }); 
      });
      
    }
  }
}

function createGenerateVsCodeDownloadCodeParameters(context, orgId: string,
    pathId: string, recipeId: string, stepId: string, customName: string) {
  const parameters = {
    name: customName
  };

  return {
    projectName: '',
    parameters: JSON.stringify(parameters),
    pathOrgId: orgId,
    pathId: pathId,
    recipeId: recipeId,
    stepId: stepId,
    vsCodeInstanceId: context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN) as string,
    userId: context.workspaceState.get(MEMENTO_RAZROO_USER_ID) as string,
    userOrgId: context.workspaceState.get(MEMENTO_RAZROO_ORG_ID) as string,
  };
}

function isComment(lineText: string): boolean {
  // Regex pattern to match comment styles across different programming languages\
  // for JavaScript, # for Python, /* for Java, <!-- for HTML,
  const commentRegex = /^(\s*\/\/)|(^#)|(^\/\*)|(^<!--)/;
  return commentRegex.test(lineText);
}