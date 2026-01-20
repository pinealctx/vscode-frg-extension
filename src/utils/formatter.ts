import * as vscode from 'vscode';
import { alignAndOutputFields, alignAndOutputEnumMembers, FieldInfo, EnumMemberInfo } from '../utils/helpers';

// FRG Formatter - Conservative approach that preserves structure
export function formatFRG(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    const indent = '    '; // 4 spaces

    // Track current context for proper indentation
    let braceLevel = 0;
    let inAttr = false;
    let inInfo = false;
    let inExternDefs = false;
    let inTypeOrStruct = false;  // Track if we're in a type or struct block for alignment
    let inEnum = false;          // Track if we're in an enum block for alignment
    let prevLineWasEmpty = false;

    // For field alignment
    let typeBlockStart = -1;
    let typeBlockFields: FieldInfo[] = [];
    let enumBlockMembers: EnumMemberInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        const originalLine = lines[i];

        // Preserve empty lines but collapse consecutive ones
        if (trimmed === '') {
            if (!prevLineWasEmpty) {
                result.push('');
                prevLineWasEmpty = true;
            }
            continue;
        }

        prevLineWasEmpty = false;

        // Detect block starts
        if (trimmed.startsWith('syntax =')) {
            result.push(trimmed);
            continue;
        }

        if (trimmed.startsWith('info(')) {
            inInfo = true;
            result.push('info(');
            continue;
        }

        if (inInfo && trimmed === ')') {
            inInfo = false;
            result.push(')');
            continue;
        }

        if (trimmed.startsWith('@externDefs')) {
            inExternDefs = true;
            braceLevel++;
            result.push('@externDefs {');
            continue;
        }

        if (trimmed.startsWith('@attr(')) {
            inAttr = true;
            result.push('@attr(');
            continue;
        }

        if (inAttr && trimmed === ')') {
            inAttr = false;
            // Closing ) for @attr - keep on separate line
            result.push(')');
            continue;
        }

        // Detect type/enum/struct/service blocks
        // Matches: type Name {, struct Name {, OR type Name struct {
        const typeMatch = trimmed.match(/^(type|struct)\s+(\w+)(?:\s+(struct))?\s*\{/);
        if (typeMatch) {
            braceLevel++;
            inTypeOrStruct = true;
            typeBlockStart = result.length;
            typeBlockFields = [];
            if (typeMatch[3]) {
                // type Name struct {
                result.push(`type ${typeMatch[2]} struct {`);
            } else {
                // type Name { or struct Name {
                result.push(`${typeMatch[1]} ${typeMatch[2]} {`);
            }
            continue;
        }

        const enumMatch = trimmed.match(/^enum\s+(\w+)\s*\{/);
        if (enumMatch) {
            braceLevel++;
            inEnum = true;
            enumBlockMembers = [];
            result.push(`enum ${enumMatch[1]} {`);
            continue;
        }

        if (trimmed === 'service {') {
            braceLevel++;
            result.push('service {');
            continue;
        }

        // Detect block ends
        if (trimmed === '}') {
            if (inTypeOrStruct && typeBlockFields.length > 0) {
                // Align and output fields
                alignAndOutputFields(result, typeBlockFields, indent);
                typeBlockFields = [];
                inTypeOrStruct = false;
            }
            if (inEnum && enumBlockMembers.length > 0) {
                // Align and output enum members
                alignAndOutputEnumMembers(result, enumBlockMembers, indent);
                enumBlockMembers = [];
                inEnum = false;
            }
            if (braceLevel > 0) braceLevel--;
            result.push('}');
            if (inExternDefs) {
                inExternDefs = false;
            }
            continue;
        }

        // Format content inside blocks
        if (inInfo) {
            const match = trimmed.match(/(\w+):\s*"([^"]*)"/);
            if (match) {
                result.push(`${indent}${match[1]}: "${match[2]}"`);
            } else if (trimmed !== ')') {
                result.push(`${indent}${trimmed}`);
            }
            continue;
        }

        if (inAttr) {
            const match = trimmed.match(/(\w+):\s*"([^"]*)"/);
            if (match) {
                result.push(`${indent}${match[1]}: "${match[2]}"`);
            } else if (trimmed !== ')') {
                result.push(`${indent}${trimmed}`);
            }
            continue;
        }

        if (inExternDefs) {
            const match = trimmed.match(/name:\s*"([^"]*)",\s*swaggerType:\s*"([^"]*)",\s*importPath:\s*"([^"]*)"/);
            if (match) {
                result.push(`${indent}name:"${match[1]}", swaggerType:"${match[2]}", importPath:"${match[3]}"`);
            } else if (trimmed !== '}') {
                result.push(`${indent}${trimmed}`);
            }
            continue;
        }

        if (inTypeOrStruct) {
            // Collect fields for alignment
            if (trimmed.startsWith('//')) {
                // If we have collected fields, align them before adding comment
                if (typeBlockFields.length > 0) {
                    alignAndOutputFields(result, typeBlockFields, indent);
                    typeBlockFields = [];
                }
                result.push(`${indent}${trimmed}`);
                continue;
            }

            // Parse field: Name Type `tag` // comment
            const fieldMatch = trimmed.match(/^(\w+)\s+(\S+)\s*(`[^`]*`)?\s*(\/\/.*)?$/);
            if (fieldMatch) {
                const name = fieldMatch[1];
                const type = fieldMatch[2];
                const tag = fieldMatch[3] || '';
                const comment = fieldMatch[4] || '';
                typeBlockFields.push({ line: i, name, type, tag, comment });
                continue;
            }

            // If we have collected fields but hit a non-field line, output them
            if (typeBlockFields.length > 0) {
                alignAndOutputFields(result, typeBlockFields, indent);
                typeBlockFields = [];
            }

            result.push(`${indent}${trimmed}`);
            continue;
        }

        if (inEnum) {
            // Collect enum members for alignment
            if (trimmed.startsWith('//')) {
                // If we have collected members, align them before adding comment
                if (enumBlockMembers.length > 0) {
                    alignAndOutputEnumMembers(result, enumBlockMembers, indent);
                    enumBlockMembers = [];
                }
                result.push(`${indent}${trimmed}`);
                continue;
            }

            // Parse enum member: Name [= value]; // comment
            // Matches: "One = 1; // comment" or "Two; // comment"
            const enumMemberMatch = trimmed.match(/^(\w+)(?:\s*=\s*([^;]+))?\s*;\s*(\/\/.*)?$/);
            if (enumMemberMatch) {
                const name = enumMemberMatch[1];
                const value = enumMemberMatch[2] ? enumMemberMatch[2].trim() : '';
                const comment = enumMemberMatch[3] || '';
                enumBlockMembers.push({ line: i, name, value, comment });
                continue;
            }

            // If we have collected members but hit a non-member line, output them
            if (enumBlockMembers.length > 0) {
                alignAndOutputEnumMembers(result, enumBlockMembers, indent);
                enumBlockMembers = [];
            }

            result.push(`${indent}${trimmed}`);
            continue;
        }

        if (braceLevel > 0) {
            // Inside service block
            if (trimmed.startsWith('@handler')) {
                const match = trimmed.match(/@handler\s+(\w+)/);
                if (match) {
                    result.push(`${indent}@handler ${match[1]}`);
                } else {
                    result.push(`${indent}${trimmed}`);
                }
                continue;
            }

            if (/^(get|post|put|delete|patch)\s+/.test(trimmed)) {
                const match = trimmed.match(/(get|post|put|delete|patch)\s+([^\s]+)\s*\(([^)]*)\)\s*(?:returns\s*\(([^)]*)\))?/);
                if (match) {
                    const method = match[1];
                    const path = match[2].trim();
                    const params = match[3].trim();
                    const returns = match[4] ? match[4].trim() : '';

                    let formatted = `${method} ${path}(${params})`;
                    if (returns) {
                        formatted += ` returns(${returns})`;
                    } else {
                        formatted += ' returns()';
                    }
                    result.push(`${indent}${formatted}`);
                    continue;
                }
            }

            if (trimmed.startsWith('//')) {
                result.push(`${indent}${trimmed}`);
                continue;
            }

            result.push(`${indent}${trimmed}`);
            continue;
        }

        // Top-level content
        if (trimmed.startsWith('import ')) {
            const match = trimmed.match(/import\s+"([^"]+)"/);
            if (match) {
                result.push(`import "${match[1]}"`);
            } else {
                result.push(trimmed);
            }
            continue;
        }

        if (trimmed.startsWith('//')) {
            result.push(trimmed);
            continue;
        }

        result.push(trimmed);
    }

    // Remove trailing empty lines, but keep one
    while (result.length > 1 && result[result.length - 1] === '') {
        result.pop();
    }

    // Ensure exactly one trailing empty line
    if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
    }

    return result.join('\n');
}
