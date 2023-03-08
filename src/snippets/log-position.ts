import { MEMENTO_RAZROO_ACCESS_TOKEN, MEMENTO_RAZROO_ID_VS_CODE_TOKEN, MEMENTO_RAZROO_ORG_ID, MEMENTO_RAZROO_USER_ID, VSCODE_ACTIVE_COLUMN_NUMBER, VSCODE_ACTIVE_LINE_NUMBER} from '../constants';
import * as vscode from 'vscode';
import { getSnippetTemplates } from './snippets.queries';
import { generateVsCodeDownloadCode } from '../graphql/generate-code/generate-code.service';
import { codeSnippetGeneratingNotification } from './snippets-notifications';

// Define a custom text decoration
const decorationType = vscode.window.createTextEditorDecorationType({
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
});

export async function logCursorPosition(context: vscode.ExtensionContext, selection: vscode.Selection, 
    isProduction: boolean, packageJsonParams: any) {
  const accessToken = context.workspaceState.get(MEMENTO_RAZROO_ACCESS_TOKEN) as string;      
  const orgId = context.workspaceState.get(MEMENTO_RAZROO_ORG_ID);
  const vsCodeToken = context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN);
  const path = vsCodeToken ? (vsCodeToken as any).split('_').pop() + '-' + packageJsonParams.version : '';
  if(!path) {
    return;
  }
  const editor = vscode.window.activeTextEditor as any;
  const lineNumber = selection.active.line + 1;
  const columnNumber = selection.active.character + 1;
  const codeLine = editor.document.lineAt(lineNumber - 1);

  const decoration = {
    range: new vscode.Range(
      codeLine.range.end,
      codeLine.range.end
    ),
    // range: new vscode.Range(lineNumber, 0, lineNumber, 0),
    renderOptions: { 
      after: {
        color: "gray",
        contentText: "👈 Type ss to select snippet",
        margin: "20px",
        border: "0.5px solid",
      }
    }
  };

  const searchText = codeLine.text.trim();
  const codeIndentationColumn = codeLine.firstNonWhitespaceCharacterIndex;
  if (isComment(searchText)) {
    // && isTabKeyPressed(searchText)
    editor.setDecorations(decorationType, [decoration], editor);
    if(!orgId) {
      return;
    }
    context.workspaceState.update(VSCODE_ACTIVE_LINE_NUMBER, lineNumber);
    context.workspaceState.update(VSCODE_ACTIVE_COLUMN_NUMBER, codeIndentationColumn);
    
    if(!doubleForwardSlashType(searchText)) {
      return;
    }
    const trimmedSearchText = removeSsFromSearchResult(searchText);
    const snippetOptions = await getSnippetTemplates(trimmedSearchText, orgId as string, path, isProduction, accessToken);
    const quickPickOptions: vscode.QuickPickItem[] = await snippetOptions ? snippetOptions.map(snippetOption => {
      return {
        orgId: snippetOption.orgId,
        pathId: snippetOption.pathId,
        recipeId: snippetOption.recipeId,
        id: snippetOption.id,
        label: snippetOption.title,
        detail: snippetOption.instructionalContent,
        parameters: snippetOption.parameters
      };
    }) : [];
    const selectedOption = await vscode.window.showQuickPick(quickPickOptions, {
      title: 'Choose A Code Snippet'
    });
    if (selectedOption) {
      const nonFilePathParameters = (selectedOption as any).parameters.filter(parameter => parameter.paramType !== 'filePath');
      const parameters = await collectInputBoxValues(nonFilePathParameters);
      codeSnippetGeneratingNotification();
      const generateVsCodeDownloadCodeParameters = createGenerateVsCodeDownloadCodeParameters(context, (selectedOption as any).orgId as string, (selectedOption as any).pathId, (selectedOption as any).recipeId, (selectedOption as any).id, parameters);
      generateVsCodeDownloadCode(generateVsCodeDownloadCodeParameters, context, isProduction).then(data => {
      });
    }
  } else {
    editor.setDecorations(decorationType, [], editor);
  }
}

async function collectInputBoxValues(nonFilePathParameters: any) {
  let parameters = {};
  let index = 0;
  return await showInputBox(nonFilePathParameters, index, parameters);
}

async function showInputBox(nonFilePathParameters: any, index: number, parameters) {
  const parameter = nonFilePathParameters[index];
  if(!parameter) {
    return;
  }
  const paramValue = await vscode.window.showInputBox({
    prompt: `${parameter?.description}?`, // Set the prompt text
    placeHolder: parameter.defualtValue  // Set the placeholder text
  });
  parameters[parameter.name] = paramValue;
  if(nonFilePathParameters[index + 1]) {
    await showInputBox(nonFilePathParameters, index, parameters);
  } else {
    return parameters;
  }
}

function createGenerateVsCodeDownloadCodeParameters(context, orgId: string,
    pathId: string, recipeId: string, stepId: string, parameters: any) {

  return {
    projectName: '',
    parameters: parameters ? JSON.stringify(parameters) : undefined,
    pathOrgId: orgId,
    pathId: pathId,
    recipeId: recipeId,
    stepId: stepId,
    vsCodeInstanceId: context.workspaceState.get(MEMENTO_RAZROO_ID_VS_CODE_TOKEN) as string,
    userId: context.workspaceState.get(MEMENTO_RAZROO_USER_ID) as string,
    userOrgId: context.workspaceState.get(MEMENTO_RAZROO_ORG_ID) as string,
  };
}

function removeSsFromSearchResult(searchText: string) {
  const trimmedSearchText = searchText.trim();
  return trimmedSearchText.replace(/ss\s*$/, '');
}

function doubleForwardSlashType(lineText: string) {
  const trimmedLineText = lineText.trim();
  const doubleForwardSlashAtEndRegex = /ss\s*$/;

  return doubleForwardSlashAtEndRegex.test(trimmedLineText);
}
function isComment(lineText: string): boolean {
  // Regex pattern to match comment styles across different programming languages\
  // for JavaScript, # for Python, /* for Java, <!-- for HTML,
  const commentRegex = /^(\s*\/\/)|(^#)|(^\/\*)|(^<!--)/;
  return commentRegex.test(lineText);
}