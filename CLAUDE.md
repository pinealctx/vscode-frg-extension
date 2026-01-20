# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension that provides language support for FRG files (`.frg` extension). FRG is a custom language used to define API handlers, types, and services with Go code generation.

## Build and Development

```bash
# Compile TypeScript to JavaScript
npm run compile

# Watch mode for development
npm run watch

# Prepare for publishing
npm run vscode:prepublish
```

The compiled output goes to the `out/` directory (configured in `tsconfig.json`). The extension entry point is `out/extension.js`.

## Architecture

The extension follows a modular architecture with separate files for each language feature:

### Directory Structure

```
src/
├── extension.ts              # Main entry point - activates all providers
├── providers/
│   ├── index.ts             # Exports all providers
│   ├── definitionProvider.ts
│   ├── documentLinkProvider.ts
│   ├── referenceProvider.ts
│   ├── codeLensProvider.ts
│   ├── documentSymbolProvider.ts
│   └── formattingProvider.ts
└── utils/
    ├── helpers.ts           # Shared utilities (findLocations, alignFields)
    └── formatter.ts         # Document formatting logic
```

### Core Language Features

1. **Definition Provider** (`providers/definitionProvider.ts`)
   - `@handler` definitions → Go function implementations (camelCase to PascalCase conversion)
   - Type/enum definitions → Searches workspace `.frg` files for `type Name {` or `enum Name {` patterns
   - Scans `.go` files for matching function signatures

2. **Document Link Provider** (`providers/documentLinkProvider.ts`)
   - Converts `import "path"` statements to clickable file links
   - Resolves paths relative to current file location

3. **Reference Provider** (`providers/referenceProvider.ts`)
   - Uses `findLocations()` helper to find all usages across `.frg` files
   - Excludes the definition line from reference results

4. **Code Lens Provider** (`providers/codeLensProvider.ts`)
   - Shows reference count above `type` and `enum` definitions
   - Click to show all references via `editor.action.showReferences` command

5. **Document Symbol Provider** (`providers/documentSymbolProvider.ts`)
   - Builds outline/breadcrumb navigation
   - Recognizes: `type`, `enum`, `service`, `info`, `@handler`
   - Type fields and enum members appear as children

6. **Formatting Provider** (`providers/formattingProvider.ts`)
   - Document and range formatting support
   - Auto-aligns fields in `type` and `struct` blocks
   - Conservative approach that preserves structure

### Helper Functions

- `findLocations(word, token)`: Core search function that scans all `.frg` files for word references (used by definition and reference providers)
- `alignAndOutputFields()`: Aligns fields by column for clean formatting (name, type, tag, comment)
- `formatFRG()`: Main formatter with support for:
  - Column-aligned fields in type/struct blocks
  - Proper indentation (4 spaces)
  - Preserved empty lines and comments

### Language Configuration

- **File Extensions**: `.frg`
- **Language ID**: `frg`
- **Syntax Grammar**: TextMate grammar in `syntaxes/frg.tmLanguage.json`
  - Keywords: `syntax`, `info`, `import`, `type`, `enum`, `struct`, `service`, `returns`
  - Built-in types: `string`, `bool`, `int`, `int32`, `int64`, `float`, `float32`, `float64`, `double`, `map`, `array`, `any`, `interface{}`
  - Decorators: `@handler`, `@attr`, `@externDefs`
  - HTTP methods: `get`, `post`, `put`, `delete`, `patch`
  - Comments: `//` and `/* */` with keyword support (`// summary:`, `// tags:`, etc.)
  - Strings: double-quoted and backtick
- **Brackets**: `{}`, `[]`, `()`

## Key Patterns

- The extension does not use a language server - it's all implemented as inline providers
- File searches use `vscode.workspace.findFiles('**/*.go', '**/node_modules/**')` pattern
- Text content is read via `vscode.workspace.fs.readFile()` and decoded with `TextDecoder`
- Regex patterns are used extensively to parse FRG syntax (no formal parser)
- Workspace scanning happens on-demand when features are invoked (not background indexing)

## Testing

No test framework is currently configured. To test changes:
1. Run `npm run compile`
2. Press F5 in VS Code to open Extension Development Host
3. Load a `.frg` file to test syntax highlighting and features
