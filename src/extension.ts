import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('FRG extension is now active!');

    const provider = vscode.languages.registerDefinitionProvider('frg', {
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
                    // Regex: func\s+.*${pascalWord}\s*\(
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
                // Find all .frg files in the workspace
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

    context.subscriptions.push(provider);

    // Document Link Provider for imports
    const linkProvider = vscode.languages.registerDocumentLinkProvider('frg', {
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
    context.subscriptions.push(linkProvider);

    // Reference Provider
    const referenceProvider = vscode.languages.registerReferenceProvider('frg', {
        provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return;
            }
            const word = document.getText(wordRange);
            
            return findLocations(word, token);
        }
    });
    context.subscriptions.push(referenceProvider);

    // CodeLens Provider
    const codeLensProvider = vscode.languages.registerCodeLensProvider('frg', {
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
                // We store the word in the command arguments to use it in resolveCodeLens
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
    context.subscriptions.push(codeLensProvider);

    // Document Symbol Provider (Outline)
    const symbolProvider = vscode.languages.registerDocumentSymbolProvider('frg', {
        provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.DocumentSymbol[] {
            const symbols: vscode.DocumentSymbol[] = [];
            const text = document.getText();
            const lines = text.split('\n');

            // Regex patterns
            const typeEnumRegex = /^\s*(type|enum)\s+([a-zA-Z0-9_]+)\s+\{/;
            const serviceRegex = /^\s*service\s+\{/;
            const handlerRegex = /^\s*@handler\s+([a-zA-Z0-9_]+)/;
            const infoRegex = /^\s*info\s*\(/;

            let currentServiceSymbol: vscode.DocumentSymbol | null = null;
            let currentBlockSymbol: vscode.DocumentSymbol | null = null; // For type/enum/info blocks

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const range = new vscode.Range(i, 0, i, line.length);
                const selectionRange = new vscode.Range(i, 0, i, line.length);

                // Check for type or enum
                const typeEnumMatch = line.match(typeEnumRegex);
                if (typeEnumMatch) {
                    const kind = typeEnumMatch[1] === 'type' ? vscode.SymbolKind.Struct : vscode.SymbolKind.Enum;
                    const name = typeEnumMatch[2];
                    const symbol = new vscode.DocumentSymbol(
                        name,
                        typeEnumMatch[1],
                        kind,
                        range,
                        selectionRange
                    );
                    symbols.push(symbol);
                    currentBlockSymbol = symbol;
                    continue;
                }

                // Check for service
                if (serviceRegex.test(line)) {
                    const symbol = new vscode.DocumentSymbol(
                        'service',
                        'Service Definition',
                        vscode.SymbolKind.Interface,
                        range,
                        selectionRange
                    );
                    symbols.push(symbol);
                    currentServiceSymbol = symbol;
                    continue;
                }

                // Check for info
                if (infoRegex.test(line)) {
                    const symbol = new vscode.DocumentSymbol(
                        'info',
                        'Package Info',
                        vscode.SymbolKind.Package,
                        range,
                        selectionRange
                    );
                    symbols.push(symbol);
                    currentBlockSymbol = symbol;
                    continue;
                }

                // Check for closing brace/paren
                if (line.trim() === '}' || line.trim() === ')') {
                    if (currentServiceSymbol) {
                        // Update range end
                        currentServiceSymbol.range = new vscode.Range(currentServiceSymbol.range.start, new vscode.Position(i, line.length));
                        currentServiceSymbol = null;
                    } else if (currentBlockSymbol) {
                        currentBlockSymbol.range = new vscode.Range(currentBlockSymbol.range.start, new vscode.Position(i, line.length));
                        currentBlockSymbol = null;
                    }
                    continue;
                }

                // Check for handler inside service
                if (currentServiceSymbol) {
                    const handlerMatch = line.match(handlerRegex);
                    if (handlerMatch) {
                        const name = handlerMatch[1];
                        const symbol = new vscode.DocumentSymbol(
                            name,
                            'Handler',
                            vscode.SymbolKind.Method,
                            range,
                            selectionRange
                        );
                        currentServiceSymbol.children.push(symbol);
                    }
                } else if (currentBlockSymbol) {
                    // Handle Type fields
                    if (currentBlockSymbol.kind === vscode.SymbolKind.Struct) {
                        // Match: FieldName FieldType ...
                        // Exclude lines that look like comments or empty lines
                        if (!line.trim().startsWith('//') && line.trim() !== '') {
                            const fieldMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_\[\]\{\}\*\.]+)/);
                            if (fieldMatch) {
                                const name = fieldMatch[1];
                                const type = fieldMatch[2];
                                const symbol = new vscode.DocumentSymbol(
                                    name,
                                    type,
                                    vscode.SymbolKind.Field,
                                    range,
                                    selectionRange
                                );
                                currentBlockSymbol.children.push(symbol);
                            }
                        }
                    }
                    // Handle Enum members
                    else if (currentBlockSymbol.kind === vscode.SymbolKind.Enum) {
                        // Match: MemberName = ... or MemberName;
                        if (!line.trim().startsWith('//') && line.trim() !== '') {
                            const enumMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*(?:=|;)/);
                            if (enumMatch) {
                                const name = enumMatch[1];
                                const symbol = new vscode.DocumentSymbol(
                                    name,
                                    '',
                                    vscode.SymbolKind.EnumMember,
                                    range,
                                    selectionRange
                                );
                                currentBlockSymbol.children.push(symbol);
                            }
                        }
                    }
                }
            }

            return symbols;
        }
    });
    context.subscriptions.push(symbolProvider);
}

// Helper to find references
async function findLocations(word: string, token: vscode.CancellationToken): Promise<vscode.Location[]> {
    const locations: vscode.Location[] = [];
    const files = await vscode.workspace.findFiles('**/*.frg', '**/node_modules/**');

    for (const file of files) {
        if (token.isCancellationRequested) return locations;
        try {
            const content = await vscode.workspace.fs.readFile(file);
            const text = new TextDecoder().decode(content);
            const lines = text.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Skip definition line to avoid showing the definition itself as a reference
                // Definition pattern: type Name { or enum Name {
                const definitionRegex = new RegExp(`^\\s*(type|enum)\\s+${word}\\s+\\{`);
                if (definitionRegex.test(line)) {
                    continue;
                }

                const regex = new RegExp(`\\b${word}\\b`, 'g');
                let match;
                while ((match = regex.exec(line)) !== null) {
                    const range = new vscode.Range(i, match.index, i, match.index + word.length);
                    locations.push(new vscode.Location(file, range));
                }
            }
        } catch (e) {
            console.error(`Error reading file ${file.fsPath}:`, e);
        }
    }
    return locations;
}

export function deactivate() {}
