import { MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_ORG_ID, MEMENTO_RAZROO_USER_ID, VSCODE_ACTIVE_LINE_NUMBER } from '../constants';
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
  const searchText = editor.document.lineAt(lineNumber - 1).text.trim();
  if (isComment(searchText)) {
    if(!orgId) {
      return;
    }
    context.workspaceState.update(VSCODE_ACTIVE_LINE_NUMBER, lineNumber);
    
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
      codeSnippetGeneratingNotification();
      const generateVsCodeDownloadCodeParameters = createGenerateVsCodeDownloadCodeParameters(context, (selectedOption as any).orgId as string, (selectedOption as any).pathId, (selectedOption as any).recipeId, (selectedOption as any).id);
      generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters, context, isProduction).then(data => {
      });
    }
  }
}

function createGenerateVsCodeDownloadCodeParameters(context, orgId: string,
    pathId: string, recipeId: string, stepId: string) {
  return {
    projectName: '',
    parameters: undefined,
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