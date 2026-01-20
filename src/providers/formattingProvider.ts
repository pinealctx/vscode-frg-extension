import * as vscode from 'vscode';
import { formatFRG } from '../utils/formatter';

export function registerFormattingProvider(): vscode.Disposable {
    // Document Formatting Provider
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('frg', {
        provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
            const text = document.getText();
            const formatted = formatFRG(text);
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            return [vscode.TextEdit.replace(fullRange, formatted)];
        }
    });

    // Document Range Formatting Provider
    const rangeFormattingProvider = vscode.languages.registerDocumentRangeFormattingEditProvider('frg', {
        provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
            const text = document.getText(range);
            const formatted = formatFRG(text);
            return [vscode.TextEdit.replace(range, formatted)];
        }
    });

    return {
        dispose: () => {
            formattingProvider.dispose();
            rangeFormattingProvider.dispose();
        }
    };
}
