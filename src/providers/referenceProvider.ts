import * as vscode from 'vscode';
import { findLocations } from '../utils/helpers';

export function registerReferenceProvider(): vscode.Disposable {
    return vscode.languages.registerReferenceProvider('frg', {
        provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return;
            }
            const word = document.getText(wordRange);

            return findLocations(word, token);
        }
    });
}
