# Vibe-Coding Notes Website - Project Requirements

## Project Overview
A personal GitHub Pages website to track daily vibe-coding notes, MCP tools, best practices, and workflow insights. Single-page application with card-based layout.

## Core Features (LOCKED SCOPE)
1. **Note Card System**
   - Display notes as cards with auto-generated timestamps
   - Each card shows: date added, title, content, tags
   - Visual hierarchy for easy scanning

2. **Add New Note**
   - Simple form to add new notes
   - Auto-timestamp with current date
   - Optional tags for categorization
   - Content supports basic markdown

3. **Search & Filter**
   - Filter by date range
   - Search by keywords in title/content
   - Filter by tags
   - Sort by date (newest/oldest)

4. **Data Persistence**
   - Local storage for all notes
   - Export functionality (JSON/Markdown)
   - Import existing notes

5. **Responsive Design**
   - Mobile-first approach
   - Works on all screen sizes
   - Touch-friendly interactions

## Technical Constraints
- **Tech Stack**: Vanilla HTML/CSS/JavaScript only
- **Hosting**: GitHub Pages compatible
- **No Backend**: Client-side only using localStorage
- **Performance**: Fast loading, minimal dependencies
- **Browser Support**: Modern browsers (ES6+)

## User Experience Goals
- Quick note addition (under 10 seconds)
- Easy browsing of historical notes
- Professional appearance for portfolio
- Intuitive navigation without tutorials
- Mobile-optimized for on-the-go use

## Design Principles
- Clean, minimal aesthetic
- Clear visual hierarchy
- Consistent spacing and typography
- Accessible color contrast
- Smooth micro-interactions

## Out of Scope
- User authentication
- Cloud synchronization
- Collaborative features
- Advanced text editing
- Image uploads
- Database integration

## Success Metrics
- Notes can be added in under 10 seconds
- Search returns results in under 1 second
- Mobile experience feels native
- Page loads in under 2 seconds
- Works offline after initial load