import { getUri } from '../utils/webview-utils/getUri';
import * as vscode from 'vscode';
import { getNonce } from '../utils/webview-utils/getNonce';

export class ProjectsWebview implements vscode.WebviewViewProvider {

    public static readonly viewType = 'razroo.projects';
    private _disposables: vscode.Disposable[] = [];

    private _view?: vscode.WebviewView;

    constructor(
      private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

      webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri);

      this._setWebviewMessageListener(webviewView.webview);
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        // The CSS file from the Angular build output
        const stylesUri = getUri(webview, extensionUri, ["projects-webview-ui", "build", "styles.css"]);
        // The JS files from the Angular build output
        const runtimeUri = getUri(webview, extensionUri, ["projects-webview-ui", "build", "runtime.js"]);
        const polyfillsUri = getUri(webview, extensionUri, ["projects-webview-ui", "build", "polyfills.js"]);
        const scriptUri = getUri(webview, extensionUri, ["projects-webview-ui", "build", "main.js"]);
    
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
  private _setWebviewMessageListener(webview: vscode.Webview) {
    console.log('webview');
    console.log(webview);
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;
        console.log('message');
        console.log(message);
        console.log('text');
        console.log(text);

        switch (command) {
          case "connectProjects":
            // Code that should run in response to the hello message command
            vscode.window.showInformationMessage(text);
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