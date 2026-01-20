# FRG Language Examples

This directory contains example FRG (`.frg`) files that demonstrate the language syntax and features.

## demo-api.frg

A comprehensive example showcasing all FRG language features:

### Syntax Elements Demonstrated

1. **Syntax Declaration**
   - `syntax = "v1"` - Version declaration

2. **Package Information**
   - `info()` block with title, description, version, author

3. **External Type Definitions**
   - `@externDefs {}` - Import external types (Go, time, etc.)

4. **Type Definitions**
   - `type` - Struct definitions with JSON tags
   - `struct` - Alternative struct syntax
   - Field attributes: `json`, `validate`, `omitempty`

5. **Enumerations**
   - `enum` - Define enumerated types
   - Enum values with comments

6. **Service Definitions**
   - `@attr()` - Service attributes (group, description)
   - `service {}` - Service block
   - `@handler` - Handler function definitions
   - HTTP routes: `get`, `post`, `put`, `delete`, `patch`
   - `returns()` - Return type specification

7. **Comments**
   - `// summary:` - Handler summary
   - `// tags:` - API tags for grouping
   - Inline comments for enum values

### Common Domain Examples

The example demonstrates typical HTTP API patterns:

- **Authentication & Authorization**
  - User registration
  - Login/logout
  - Profile management
  - Password change

- **CRUD Operations**
  - Create, Read, Update, Delete (posts)
  - List with pagination
  - Search functionality

- **Data Types**
  - Request/Response wrappers
  - Pagination metadata
  - Error responses
  - Enumerated status types

### Usage

To test the extension:
1. Open any `.frg` file in this directory
2. Observe syntax highlighting
3. Use **F12** (Go to Definition) on type names
4. Use **Shift+F12** (Find References)
5. Use **Ctrl+Shift+F** (Format Document) to auto-align fields
6. View Outline (Ctrl+Shift+O) for file structure

## Adding More Examples

When adding new examples:
- Use generic domain concepts (User, Post, Comment, etc.)
- Avoid real proprietary information
- Demonstrate specific language features
- Include comments explaining complex syntax
