import * as vscode from 'vscode';
import { findLocations } from '../utils/helpers';

export function registerCodeLensProvider(): vscode.Disposable {
    return vscode.languages.registerCodeLensProvider('frg', {
        provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
            const codeLenses: vscode.CodeLens[] = [];
            const text = document.getText();
            const regex = /^\s*(type|enum)\s+([a-zA-Z0-9_]+)\s+\{/gm;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const line = document.positionAt(match.index).line;
                const word = match[2];
                const nameStartIndex = match[0].indexOf(word);
                const namePosition = document.positionAt(match.index + nameStartIndex);
                const range = new vscode.Range(namePosition, namePosition.translate(0, word.length));

                // Create a CodeLens for the type/enum definition
                const codeLens = new vscode.CodeLens(range);
                // @ts-ignore
                codeLens.word = word;
                // @ts-ignore
                codeLens.documentUri = document.uri;
                codeLenses.push(codeLens);
            }
            return codeLenses;
        },
        async resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): Promise<vscode.CodeLens> {
            // @ts-ignore
            const word = codeLens.word;
            // @ts-ignore
            const documentUri = codeLens.documentUri;
            const locations = await findLocations(word, token);

            codeLens.command = {
                title: `${locations.length} references`,
                tooltip: "Click to show references",
                command: "editor.action.showReferences",
                arguments: [documentUri, codeLens.range.start, locations]
            };
            return codeLens;
        }
    });
}
