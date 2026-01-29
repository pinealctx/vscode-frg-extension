import * as vscode from 'vscode';

// Helper to find references/definitions across workspace
export async function findLocations(word: string, token: vscode.CancellationToken): Promise<vscode.Location[]> {
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

// Helper to align and output fields for formatting
export interface FieldInfo {
    line: number;
    name: string;
    type: string;
    tag: string;
    comment: string;
}

export function alignAndOutputFields(
    result: string[],
    fields: FieldInfo[],
    indent: string
): void {
    if (fields.length === 0) return;

    // Calculate maximum widths
    let maxNameLen = 0;
    let maxTypeLen = 0;

    for (const field of fields) {
        maxNameLen = Math.max(maxNameLen, field.name.length);
        maxTypeLen = Math.max(maxTypeLen, field.type.length);
    }

    // Calculate content width up to and including tag for each field
    const fieldWidths = fields.map(field => {
        const namePart = field.name.padEnd(maxNameLen);
        const typePart = field.type.padEnd(maxTypeLen);
        const tagPart = field.tag ? ` ${field.tag}` : '';
        return indent.length + namePart.length + 1 + typePart.length + tagPart.length;
    });

    const maxContentWidth = Math.max(...fieldWidths);

    // Output aligned fields
    for (const field of fields) {
        let aligned = `${indent}${field.name.padEnd(maxNameLen)} ${field.type.padEnd(maxTypeLen)}`;
        if (field.tag) {
            aligned += ` ${field.tag}`;
        }
        // Only add comment alignment padding if there's a comment
        if (field.comment) {
            const currentWidth = aligned.length;
            if (currentWidth < maxContentWidth) {
                aligned += ' '.repeat(maxContentWidth - currentWidth);
            }
            aligned += ` ${field.comment}`;
        }
        result.push(aligned);
    }
}

// Enum member info for alignment
export interface EnumMemberInfo {
    line: number;
    name: string;
    value: string;  // e.g., "1" or "" (without "=" and semicolon)
    comment: string;
}

export function alignAndOutputEnumMembers(
    result: string[],
    members: EnumMemberInfo[],
    indent: string
): void {
    if (members.length === 0) return;

    // Calculate maximum widths
    let maxNameLen = 0;

    for (const member of members) {
        maxNameLen = Math.max(maxNameLen, member.name.length);
    }

    // Calculate content width up to and including semicolon for each member
    const memberWidths = members.map(member => {
        const namePart = member.name.padEnd(maxNameLen);
        const valuePart = member.value ? ` = ${member.value};` : ';';
        return indent.length + namePart.length + valuePart.length;
    });

    const maxContentWidth = Math.max(...memberWidths);

    // Output aligned enum members
    for (const member of members) {
        let aligned = `${indent}${member.name.padEnd(maxNameLen)}`;
        if (member.value) {
            aligned += ` = ${member.value};`;
        } else {
            aligned += ';';
        }
        // Only add comment alignment padding if there's a comment
        if (member.comment) {
            const currentWidth = aligned.length;
            if (currentWidth < maxContentWidth) {
                aligned += ' '.repeat(maxContentWidth - currentWidth);
            }
            aligned += ` ${member.comment}`;
        }
        result.push(aligned);
    }
}
