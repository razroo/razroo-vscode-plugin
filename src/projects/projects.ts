import * as vscode from 'vscode';

export class ProjectsWebview implements vscode.WebviewViewProvider {

    public static readonly viewType = 'razroo.projects';

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

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        // Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Razroo Projects</title>
                // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.

            </head>
            <body>
                <select>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                </select>
                <button>Submit</button>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}