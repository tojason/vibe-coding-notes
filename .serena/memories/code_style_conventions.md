# Code Style and Conventions

## Agent Documentation Standards
### YAML Frontmatter Requirements
- `name`: kebab-case unique identifier
- `description`: Usage context + 3-4 detailed examples with commentary
- `color`: Visual identification (blue, green, purple, etc.)
- `tools`: Specific tools the agent can access

### Agent Content Structure
- **Identity**: Clear role definition (500+ words)
- **Responsibilities**: 5-8 specific primary duties
- **Examples**: Realistic usage scenarios with context
- **Best Practices**: Specific methodologies
- **Success Metrics**: Measurable outcomes

## Website Code Conventions
### JavaScript (ES6+)
- **Modules**: ES6 module system with explicit imports/exports
- **Classes**: Use class syntax for main components
- **Naming**: 
  - Classes: PascalCase (`VibeCodingNotes`)
  - Methods: camelCase (`addNote`, `renderUI`)
  - Constants: SCREAMING_SNAKE_CASE (`CACHE_NAME`)
- **No Build Tools**: Direct browser-compatible JavaScript
- **Error Handling**: Try-catch blocks with user-friendly messages

### CSS
- **Architecture**: CSS Custom Properties (CSS Variables)
- **Naming**: kebab-case for classes (`.note-card`)
- **Responsive**: Mobile-first approach with min-width media queries
- **Performance**: GPU-accelerated animations with transform/opacity
- **Spacing**: 8px-based grid system

### HTML
- **Semantic**: Proper HTML5 semantic elements
- **Accessibility**: WCAG AA compliance with proper ARIA labels
- **Performance**: Minimal external dependencies

## File Organization
- Keep modules small and focused (single responsibility)
- Separate concerns: App.js (controller), Store.js (data), UI.js (interface)
- Document major design decisions in agent-outputs/