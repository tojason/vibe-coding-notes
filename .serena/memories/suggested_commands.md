# Essential Commands

## Local Development
```bash
# Serve the website locally (Python 3)
cd vibe-coding-website
python -m http.server 8000

# Alternative static server
npx serve src/
```

## Testing Commands
```bash
# HTML validation
npx html-validate vibe-coding-website/index.html

# Accessibility testing  
npx pa11y http://localhost:8000

# Performance testing
lighthouse http://localhost:8000 --output=html

# Basic JavaScript test
cd vibe-coding-website
node tests/app.test.js
```

## Git Operations
```bash
# View status
git status

# Add files
git add .

# Commit changes
git commit -m "Description of changes"

# Push to remote
git push origin main
```

## File Operations
```bash
# List files recursively
find . -type f -name "*.md" | head -20

# Search for patterns
grep -r "pattern" .

# View file contents
cat filename
head -20 filename
```

## GitHub Pages Deployment
```bash
# Copy website files to root for deployment
cp -r vibe-coding-website/src/* .
git add .
git commit -m "Deploy website"
git push origin main
```

## Agent Development
```bash
# Copy agents to Claude Code directory
cp -r agents-database/* ~/.claude/agents/

# Restart Claude Code to load new agents
# (restart Claude Code application)
```