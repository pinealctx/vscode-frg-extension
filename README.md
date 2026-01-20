# FRG Language Support

[![VS Code](https://img.shields.io/badge/VS_Code-1.75.0-blue.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Visual Studio Code language support for **FRG** files - a custom language for defining API handlers, types, and services with Go code generation.

## Features

### 🎨 Syntax Highlighting
- Comprehensive syntax highlighting for all FRG language constructs
- Support for keywords: `syntax`, `info`, `import`, `type`, `enum`, `struct`, `service`, `returns`
- Built-in types: `string`, `bool`, `int`, `int32`, `int64`, `float`, `float32`, `float64`, `double`, `map`, `array`, `any`, `interface{}`
- Decorators: `@handler`, `@attr`, `@externDefs`
- HTTP methods: `get`, `post`, `put`, `delete`, `patch`
- Enhanced comment highlighting with keyword support (`// summary:`, `// tags:`, etc.)
- Go struct tags highlighting

### 🔍 Navigation & Search
- **Go to Definition** (`F12`)
  - Jump from `@handler` names to Go function implementations
  - Navigate between `type`/`enum` definitions and their usages
- **Find All References** (`Shift+F12`)
  - Quickly find where types and enums are used
- **Document Symbol Provider**
  - Outline view with breadcrumbs
  - Navigate to services, handlers, types, enums

### 📝 Code Editing
- **Document Formatting** (`Shift+Alt+F` / `Shift+Opt+F`)
  - Auto-align fields in `type` and `struct` blocks
  - 4-space indentation
  - Preserves comments and structure
- **Range Formatting** - Format selected text only
- **Import File Links** - Clickable import paths
- **Reference Code Lens** - Shows reference count above type/enum definitions

## Example

```frg
syntax = "v1"

info(
    title: "Demo API"
    desc: "A comprehensive FRG language example"
    version: "v1.0.0"
)

type User {
    ID       string  `json:"id"`
    Email    string  `json:"email" validate:"email"`
    Status   UserStatus `json:"status"`
}

enum UserStatus {
    Active   = 1; // Active user
    Inactive = 2; // Inactive user
}

@attr(
    group: "users"
    desc: "User management operations"
)
service {
    // summary: Get user by ID
    // tags: Users
    @handler getUser
    get /api/v1/users/:id() returns(User)

    // summary: Create new user
    // tags: Users
    @handler createUser
    post /api/v1/users(User) returns(User)
}
```

## Requirements

- Visual Studio Code version 1.75.0 or higher

## Installation

This extension is available on the Visual Studio Marketplace. To install:

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Enter `ext install frg-language-support`
4. Reload VS Code when prompted

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Prepare for publishing
npm run vscode:prepublish
```

## File Structure

```
src/
├── extension.ts              # Main entry point
├── providers/                # Language feature providers
│   ├── definitionProvider.ts      # Go to Definition
│   ├── documentLinkProvider.ts    # Import file links
│   ├── referenceProvider.ts       # Find References
│   ├── codeLensProvider.ts        # Reference count
│   ├── documentSymbolProvider.ts  # Outline view
│   └── formattingProvider.ts      # Document formatting
└── utils/                    # Utilities
    ├── helpers.ts               # Shared functions
    └── formatter.ts             # Formatting logic
```

## License

MIT

## Support

For issues, questions, or contributions, please visit [GitHub Repository](https://github.com/pinealctx/vscode-frg-extension).
