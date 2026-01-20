import * as vscode from 'vscode';
import * as path from 'path';

export function registerDocumentLinkProvider(): vscode.Disposable {
    return vscode.languages.registerDocumentLinkProvider('frg', {
        provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken) {
            const links: vscode.DocumentLink[] = [];
            const text = document.getText();
            const importRegex = /import\s+"([^"]+)"/g;
            let match;

            while ((match = importRegex.exec(text)) !== null) {
                const filePath = match[1];
                const startPos = document.positionAt(match.index + match[0].indexOf(filePath));
                const endPos = document.positionAt(match.index + match[0].indexOf(filePath) + filePath.length);
                const range = new vscode.Range(startPos, endPos);

                // Resolve path relative to current file
                const currentDir = path.dirname(document.uri.fsPath);
                const targetPath = path.join(currentDir, filePath);
                const targetUri = vscode.Uri.file(targetPath);

                links.push(new vscode.DocumentLink(range, targetUri));
            }
            return links;
        }
    });
}
