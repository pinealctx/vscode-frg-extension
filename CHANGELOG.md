# Changelog

All notable changes to the FRG Language Support extension will be documented in this file.

## [0.0.3] - Current

### Added
- **Document Formatting** - Auto-align fields in type/struct blocks with column alignment
- **Comment Keyword Highlighting** - Enhanced comment support for `// summary:`, `// tags:`, etc.
- **Modular Architecture** - Restructured codebase into separate provider modules
- **Type/Struct Support** - Added `struct` keyword and enhanced type definitions
- **Enhanced Type Support** - Added `any` type support
- **ExternDefs Support** - Added `@externDefs` decorator for external type definitions

### Changed
- Improved syntax highlighting for HTTP route parameters and return types
- Refactored formatter to preserve comments and structure
- Enhanced enum member highlighting
- Updated examples with generic domain patterns

### Fixed
- Fixed type/enum definition navigation to show references instead of jumping to definition
- Fixed formatting to not add trailing spaces on lines without comments
- Fixed import path resolution
- Improved comment alignment logic for tags and inline comments

## [0.0.2] - Previous

### Added
- Initial syntax highlighting for FRG files
- Go to Definition support for @handler definitions
- Document links for import statements
- Find References for types and enums
- Code Lens showing reference count
- Document Symbol Provider for outline view

## [0.0.1] - Initial Release

### Added
- Basic FRG language support
- Syntax highlighting for keywords and types
