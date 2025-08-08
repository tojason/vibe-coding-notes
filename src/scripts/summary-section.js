/**
 * Summary Section Functionality
 * Analyzes notes and generates key insights
 */

class SummarySection {
  constructor(notesApp) {
    this.notesApp = notesApp;
    this.elements = {
      summaryToggle: document.getElementById('summary-toggle'),
      summaryContent: document.getElementById('summary-content'),
      totalNotes: document.getElementById('total-notes'),
      activeTodos: document.getElementById('active-todos'),
      completedTodos: document.getElementById('completed-todos'),
      topTags: document.getElementById('top-tags'),
      keyPointsGrid: document.getElementById('key-points-grid'),
      tagCloud: document.getElementById('tag-cloud')
    };
    
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    // Toggle summary section
    this.elements.summaryToggle?.addEventListener('click', () => {
      const isExpanded = this.elements.summaryToggle.getAttribute('aria-expanded') === 'true';
      this.elements.summaryToggle.setAttribute('aria-expanded', !isExpanded);
      this.elements.summaryContent.classList.toggle('collapsed', isExpanded);
    });
  }
  
  /**
   * Update all summary sections
   */
  updateSummary() {
    this.updateStatistics();
    this.updateKeyPoints();
    this.updateTagCloud();
  }
  
  /**
   * Update statistics cards
   */
  updateStatistics() {
    const notes = this.notesApp.notes;
    
    // Total notes
    this.elements.totalNotes.textContent = notes.length;
    
    // Active todos
    const activeTodos = notes.filter(note => note.isTodo && !note.isCompleted).length;
    this.elements.activeTodos.textContent = activeTodos;
    
    // Completed todos
    const completedTodos = notes.filter(note => note.isTodo && note.isCompleted).length;
    this.elements.completedTodos.textContent = completedTodos;
    
    // Unique tags
    const uniqueTags = new Set();
    notes.forEach(note => {
      note.tags.forEach(tag => uniqueTags.add(tag));
    });
    this.elements.topTags.textContent = uniqueTags.size;
  }
  
  /**
   * Extract and display key points from recent notes
   */
  updateKeyPoints() {
    const notes = this.notesApp.notes;
    const keyPoints = this.extractKeyPoints(notes);
    
    // Clear existing key points
    this.elements.keyPointsGrid.innerHTML = '';
    
    if (keyPoints.length === 0) {
      this.elements.keyPointsGrid.innerHTML = `
        <div class="key-points-empty">
          No key points yet. Start adding notes to see insights here.
        </div>
      `;
      return;
    }
    
    // Display key points
    keyPoints.forEach(point => {
      const keyPointEl = document.createElement('div');
      keyPointEl.className = 'key-point-item';
      keyPointEl.innerHTML = `
        <div class="key-point-bullet">•</div>
        <div class="key-point-content">
          <p class="key-point-text">${this.notesApp.escapeHtml(point.text)}</p>
          <div class="key-point-source">
            <span>From: ${this.notesApp.escapeHtml(point.noteTitle)}</span>
            <span class="key-point-date">• ${point.date}</span>
          </div>
        </div>
      `;
      this.elements.keyPointsGrid.appendChild(keyPointEl);
    });
  }
  
  /**
   * Extract key points from notes
   */
  extractKeyPoints(notes) {
    const keyPoints = [];
    
    // Get recent notes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentNotes = notes
      .filter(note => new Date(note.createdAt) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10); // Top 10 recent notes
    
    recentNotes.forEach(note => {
      const points = this.extractKeyPointsFromContent(note.content);
      points.forEach(point => {
        keyPoints.push({
          text: point,
          noteTitle: note.title || 'Untitled Note',
          noteId: note.id,
          date: this.notesApp.getRelativeTime(note.createdAt)
        });
      });
    });
    
    // Return top 5 key points
    return keyPoints.slice(0, 5);
  }
  
  /**
   * Extract key sentences from note content
   */
  extractKeyPointsFromContent(content) {
    const keyPoints = [];
    
    // Split content into sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    
    // Filter and score sentences
    const scoredSentences = sentences.map(sentence => {
      const trimmed = sentence.trim();
      let score = 0;
      
      // Score based on various factors
      // Length preference (not too short, not too long)
      if (trimmed.length > 30 && trimmed.length < 200) score += 2;
      
      // Contains important keywords
      const importantKeywords = [
        'important', 'key', 'critical', 'essential', 'must', 'should',
        'learn', 'discovered', 'found', 'realized', 'understand',
        'fix', 'solve', 'implement', 'create', 'build', 'improve',
        'mcp', 'tool', 'workflow', 'practice', 'tip', 'technique'
      ];
      
      importantKeywords.forEach(keyword => {
        if (trimmed.toLowerCase().includes(keyword)) score += 1;
      });
      
      // Contains patterns that indicate key information
      if (trimmed.match(/^\d+\.|^-|^•|^→/)) score += 1; // List items
      if (trimmed.includes(':')) score += 1; // Definitions
      if (trimmed.match(/[A-Z]{2,}/)) score += 1; // Acronyms
      
      return { text: trimmed, score };
    });
    
    // Sort by score and get top sentences
    scoredSentences.sort((a, b) => b.score - a.score);
    
    // Get top 2 sentences per note
    return scoredSentences
      .slice(0, 2)
      .filter(item => item.score > 0)
      .map(item => item.text);
  }
  
  /**
   * Update tag cloud
   */
  updateTagCloud() {
    const notes = this.notesApp.notes;
    const tagFrequency = {};
    
    // Count tag frequency
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });
    
    // Clear existing tag cloud
    this.elements.tagCloud.innerHTML = '';
    
    const tags = Object.entries(tagFrequency);
    
    if (tags.length === 0) {
      this.elements.tagCloud.innerHTML = `
        <div class="tag-cloud-empty">
          No tags yet. Add tags to your notes to see them here.
        </div>
      `;
      return;
    }
    
    // Sort by frequency
    tags.sort((a, b) => b[1] - a[1]);
    
    // Calculate size classes based on frequency
    const maxFreq = Math.max(...tags.map(t => t[1]));
    
    tags.forEach(([tag, count]) => {
      const tagEl = document.createElement('button');
      tagEl.className = 'tag-cloud-item';
      
      // Assign size class based on frequency
      const sizeClass = this.getTagSizeClass(count, maxFreq);
      tagEl.classList.add(`size-${sizeClass}`);
      
      tagEl.innerHTML = `
        ${this.notesApp.escapeHtml(tag)}
        <span class="tag-count">(${count})</span>
      `;
      
      // Click to filter by this tag
      tagEl.addEventListener('click', () => {
        // Find and click the corresponding tag filter
        const tagFilters = document.querySelectorAll('.tag-filter-chip');
        tagFilters.forEach(filter => {
          if (filter.textContent.includes(tag)) {
            filter.click();
          }
        });
      });
      
      this.elements.tagCloud.appendChild(tagEl);
    });
  }
  
  /**
   * Calculate tag size class based on frequency
   */
  getTagSizeClass(count, maxCount) {
    const ratio = count / maxCount;
    if (ratio >= 0.75) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
  }
}

// Initialize summary section after NotesApp is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for NotesApp to be initialized
  setTimeout(() => {
    if (window.vibeNotesApp) {
      window.summarySection = new SummarySection(window.vibeNotesApp);
      
      // Initial update
      window.summarySection.updateSummary();
      
      // Update summary when notes change
      const originalAddNote = window.vibeNotesApp.addNote.bind(window.vibeNotesApp);
      window.vibeNotesApp.addNote = function(...args) {
        const result = originalAddNote(...args);
        window.summarySection.updateSummary();
        return result;
      };
      
      const originalUpdateNote = window.vibeNotesApp.updateNote.bind(window.vibeNotesApp);
      window.vibeNotesApp.updateNote = function(...args) {
        const result = originalUpdateNote(...args);
        window.summarySection.updateSummary();
        return result;
      };
      
      const originalDeleteNote = window.vibeNotesApp.deleteNote.bind(window.vibeNotesApp);
      window.vibeNotesApp.deleteNote = function(...args) {
        const result = originalDeleteNote(...args);
        window.summarySection.updateSummary();
        return result;
      };
      
      const originalToggleTodoStatus = window.vibeNotesApp.toggleTodoStatus.bind(window.vibeNotesApp);
      window.vibeNotesApp.toggleTodoStatus = function(...args) {
        const result = originalToggleTodoStatus(...args);
        window.summarySection.updateSummary();
        return result;
      };
    }
  }, 1000);
});