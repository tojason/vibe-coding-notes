# Task Completion Workflow

## For Agent Development Tasks

### When Creating/Modifying Agents
1. **Validation Checklist**:
   - [ ] YAML frontmatter follows required format
   - [ ] Description includes 3-4 detailed examples
   - [ ] System prompt is 500+ words
   - [ ] Agent triggers correctly for use cases
   - [ ] Documentation is clear and actionable

2. **Testing Process**:
   - Test agent activation with sample requests
   - Verify tool access works properly
   - Validate output quality and usefulness
   - Check integration with other agents

3. **No Formal Linting**: Agents are markdown files - rely on manual review

## For Website Development Tasks

### Pre-Completion Checks
1. **Local Testing**:
   ```bash
   cd vibe-coding-website
   python -m http.server 8000
   # Test functionality at http://localhost:8000
   ```

2. **Performance Validation**:
   ```bash
   # Check performance metrics
   lighthouse http://localhost:8000 --output=html
   ```

3. **Accessibility Check**:
   ```bash
   npx pa11y http://localhost:8000
   ```

4. **HTML Validation**:
   ```bash
   npx html-validate index.html
   ```

### Quality Standards
- **Performance**: First Contentful Paint <1.8s
- **Bundle Size**: Total <50KB
- **Accessibility**: WCAG AA compliance
- **Browser Support**: Chrome 88+, Safari 14+, Firefox 85+, Edge 88+

## General Development Tasks

### Always Run After Code Changes
1. **Test locally first** before committing
2. **Validate functionality** matches requirements  
3. **Check mobile responsiveness** if UI changes
4. **Verify no console errors** in browser dev tools

### Documentation Updates
- Update agent-outputs/ files when making significant changes
- Keep README.md current with new features
- Update CLAUDE.md for workflow changes

### No Formal CI/CD
This project uses simple static hosting - manual validation is sufficient before deployment.