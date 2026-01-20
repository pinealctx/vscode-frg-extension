import * as vscode from 'vscode';

export function registerDocumentSymbolProvider(): vscode.Disposable {
    return vscode.languages.registerDocumentSymbolProvider('frg', {
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
}
