# Technology Stack

## Agents Database
- **Format**: Markdown files with YAML frontmatter
- **Structure**: Organized by department/role
- **Integration**: Claude Code sub-agents system
- **Dependencies**: None - pure configuration files

## Vibe-Coding Website
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Custom Properties, CSS Grid, Flexbox
- **Storage**: LocalStorage API for client-side persistence
- **Icons**: Unicode symbols and CSS shapes (no external dependencies)
- **PWA**: Progressive Web App features with service worker
- **Architecture**: Modular JavaScript with ES6 modules
  - `App.js` - Main application controller
  - `Store.js` - Data persistence layer
  - `UI.js` - User interface management

## Development Environment
- **Platform**: Linux (WSL2)
- **No Build Tools**: Direct HTML/CSS/JS development
- **Hosting**: GitHub Pages compatible
- **Testing**: Minimal JavaScript testing without frameworks

## Browser Support
- Chrome 88+
- Safari 14+  
- Firefox 85+
- Edge 88+

## Performance Targets
- Bundle Size: <50KB total
- First Contentful Paint: <1.8s
- Time to Interactive: <3.9s
- Lighthouse Score: 95+