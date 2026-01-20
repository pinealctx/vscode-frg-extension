import * as vscode from 'vscode';
import * as path from 'path';

export function registerDefinitionProvider(): vscode.Disposable {
    return vscode.languages.registerDefinitionProvider('frg', {
        provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return;
            }
            const word = document.getText(wordRange);
            const line = document.lineAt(position.line).text;

            // Check if we are clicking on a handler name
            // Line format: @handler handlerName
            const handlerMatch = line.match(/@handler\s+([a-zA-Z0-9_]+)/);
            if (handlerMatch && handlerMatch[1] === word) {
                // It is a handler. We need to find the Go implementation.
                // Convert camelCase to PascalCase
                const pascalWord = word.charAt(0).toUpperCase() + word.slice(1);

                return new Promise<vscode.Location[]>(async (resolve, reject) => {
                    const locations: vscode.Location[] = [];
                    // Search in .go files
                    // We look for: func (s *Server) HandlerName(
                    const goFiles = await vscode.workspace.findFiles('**/*.go', '**/node_modules/**');

                    const goRegex = new RegExp(`func\\s+.*${pascalWord}\\s*\\(`);

                    for (const file of goFiles) {
                        try {
                            const content = await vscode.workspace.fs.readFile(file);
                            const fileText = new TextDecoder().decode(content);
                            const lines = fileText.split('\n');
                            for (let i = 0; i < lines.length; i++) {
                                if (goRegex.test(lines[i])) {
                                    locations.push(new vscode.Location(file, new vscode.Position(i, 0)));
                                }
                            }
                        } catch (e) {
                            console.error(`Error reading file ${file.fsPath}:`, e);
                        }
                    }
                    resolve(locations);
                });
            }

            // Otherwise, look for type or enum definition
            // We are looking for "type <Word> {" or "enum <Word> {"
            const definitionRegex = new RegExp(`^\\s*(type|enum)\\s+${word}\\s+\\{`);

            // Check if we are currently AT the definition
            if (definitionRegex.test(line)) {
                // We are on the definition line. Ctrl+Click here should show references.
                const { findLocations } = require('../utils/helpers');
                return findLocations(word, token);
            }

            return new Promise<vscode.Location[]>(async (resolve, reject) => {
                const locations: vscode.Location[] = [];

                // Helper function to search in a document text
                const searchInText = (text: string, uri: vscode.Uri) => {
                    const lines = text.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (definitionRegex.test(lines[i])) {
                            locations.push(new vscode.Location(uri, new vscode.Position(i, 0)));
                        }
                    }
                };

                // 1. Search in current file
                searchInText(document.getText(), document.uri);

                // 2. Search in workspace files
                const files = await vscode.workspace.findFiles('**/*.frg', '**/node_modules/**');

                for (const file of files) {
                    if (file.fsPath === document.uri.fsPath) continue; // Skip current file

                    try {
                        const content = await vscode.workspace.fs.readFile(file);
                        const fileText = new TextDecoder().decode(content);
                        searchInText(fileText, file);
                    } catch (e) {
                        console.error(`Error reading file ${file.fsPath}:`, e);
                    }
                }

                resolve(locations);
            });
        }
    });
}
