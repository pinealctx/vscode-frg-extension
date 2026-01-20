# Contributing to FRG Language Support

Thank you for your interest in contributing to the FRG Language Support extension!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/pinealctx/vscode-frg-extension.git
cd vscode-frg-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

## Project Structure

```
src/
├── extension.ts              # Main entry point
├── providers/                # Language feature providers
└── utils/                    # Utilities
```

## Adding New Features

### Adding a New Language Provider

1. Create a new file in `src/providers/` (e.g., `myProvider.ts`)
2. Export a registration function:

```typescript
import * as vscode from 'vscode';

export function registerMyProvider(): vscode.Disposable {
    return vscode.languages.registerMyProvider('frg', {
        // implementation
    });
}
```

3. Import and register in `src/extension.ts`:

```typescript
import { registerMyProvider } from './providers/myProvider';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(registerMyProvider());
}
```

4. Export from `src/providers/index.ts`:

```typescript
export { registerMyProvider } from './myProvider';
```

### Adding Syntax Highlighting

Edit `syntaxes/frg.tmLanguage.json` to add new patterns or modify existing ones.

## Testing

### Manual Testing

1. Run `npm run compile`
2. Press `F5` to open Extension Development Host
3. Open a `.frg` file to test your changes

### Key Test Areas

- **Syntax Highlighting**: Verify all keywords, types, decorators are highlighted
- **Go to Definition**: Test `F12` on handlers and types
- **Formatting**: Test `Shift+Alt+F` and verify alignment
- **Code Lens**: Check reference counts appear correctly
- **Document Symbols**: View outline (Ctrl+Shift+O)

## Code Style

- Use TypeScript for all source files
- Follow existing code formatting
- Add JSDoc comments for public functions
- Keep providers modular and focused

## Submitting Changes

1. Create a descriptive branch name
2. Make your changes following the coding standards
3. Test thoroughly
4. Commit with clear messages
5. Submit a pull request to the `main` branch

## Questions?

Feel free to open an issue for discussion before making large changes.
