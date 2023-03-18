import { getUri } from '../utils/webview-utils/getUri';
import * as vscode from 'vscode';
import { getNonce } from '../utils/webview-utils/getNonce';
import { tryToAuth } from 'utils/utils';

export class ProjectsWebview implements vscode.WebviewViewProvider {

    public static readonly viewType = 'razroo.projects';
    private _disposables: vscode.Disposable[] = [];

    view?: vscode.WebviewView;
    _extensionUri = this.extensionContext.extensionUri;

    constructor(
      private extensionContext: vscode.ExtensionContext
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
		    _token: vscode.CancellationToken
    ): void {
        this.view = webviewView;

        webviewView.webview.options = {
			// Allow scripts in the webview
          enableScripts: true,

          localResourceRoots: [
            this._extensionUri
          ]
		  };

      webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri);

      this._setWebviewMessageListener(webviewView.webview, context);
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        // The CSS file from the Angular build output
        const stylesUri = getUri(webview, extensionUri, ["dist", "projects-webview-ui", "styles.css"]);
        // The JS files from the Angular build output
        const runtimeUri = getUri(webview, extensionUri, ["dist", "projects-webview-ui", "runtime.js"]);
        const polyfillsUri = getUri(webview, extensionUri, ["dist", "projects-webview-ui", "polyfills.js"]);
        const scriptUri = getUri(webview, extensionUri, ["dist", "projects-webview-ui", "main.js"]);
    
        const nonce = getNonce();
    
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
              <link rel="stylesheet" type="text/css" href="${stylesUri}">
              <title>Razroo Projects</title>
            </head>
            <body>
              <app-root></app-root>
              <script type="module" nonce="${nonce}" src="${runtimeUri}"></script>
              <script type="module" nonce="${nonce}" src="${polyfillsUri}"></script>
              <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
            </body>
          </html>
        `;
      }

      /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: vscode.Webview, context: vscode.WebviewViewResolveContext) {
    // Handle messages sent from the extension
    webview.onDidReceiveMessage(
      (message: any) => {
        const {command, text, data} = message;
        
        switch (command) {
          case "connectProjects":
            vscode.commands.executeCommand('extension.auth0Authentication');
            return;
          case "initialAuthInfoRequest":
            vscode.commands.executeCommand('extension.tryToAuth');
            return;  
          case "unConnectProject":
            vscode.commands.executeCommand('extension.logout');
            return;    
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }
}