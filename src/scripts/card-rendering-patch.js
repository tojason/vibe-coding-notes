/**
 * Card Rendering Patch for shadcn/ui Integration
 * This file contains the updated createNoteCard function with proper shadcn structure
 */

// Store the original createNoteCard function for reference
const originalCreateNoteCard = NotesApp.prototype.createNoteCard;

// Override the createNoteCard function with shadcn-compatible version
NotesApp.prototype.createNoteCard = function(note, index) {
  const card = document.createElement('article');
  card.className = 'card note-card';
  card.dataset.noteId = note.id;
  card.tabIndex = 0;
  card.style.animationDelay = `${index * 50}ms`;
  
  // Add todo-specific classes
  if (note.isTodo) {
    card.classList.add('todo-card');
    if (note.isCompleted) {
      card.classList.add('completed');
    }
  }
  
  // Highlight search results
  if (this.currentSearch) {
    card.classList.add('highlighted');
  }
  
  // Generate tags HTML with proper badge classes
  const tagsHtml = note.tags.length > 0 
    ? note.tags.map(tag => `
        <span class="badge badge-secondary note-tag ${tag.toLowerCase().replace(/\s+/g, '-')}">
          ${this.escapeHtml(tag)}
        </span>
      `).join('')
    : '';
  
  // Generate relative time
  const relativeTime = this.getRelativeTime(note.createdAt);
  
  // Priority badge for todos
  const priorityBadgeHtml = note.isTodo && note.priority ? `
    <span class="badge badge-destructive">Critical</span>
  ` : '';
  
  // Card structure based on whether it's a todo or regular note
  if (note.isTodo) {
    card.innerHTML = `
      <div class="card-header note-header">
        <div class="note-tags">
          <span class="badge badge-todo">Todo</span>
          ${priorityBadgeHtml}
        </div>
        <div class="note-meta">
          <time class="note-timestamp" datetime="${note.createdAt}">${relativeTime}</time>
        </div>
      </div>
      
      <div class="card-content note-content">
        <div class="todo-content">
          <input type="checkbox" 
                 class="checkbox todo-checkbox" 
                 id="checkbox-${note.id}"
                 data-note-id="${note.id}"
                 ${note.isCompleted ? 'checked' : ''}
                 aria-label="Mark task as completed" />
          <div class="todo-text ${note.isCompleted ? 'completed' : ''}">
            <h3 class="card-title note-title">${this.escapeHtml(note.title || this.generateTitle(note.content))}</h3>
            <p class="note-body">${this.highlightSearchTerm(this.escapeHtml(this.truncateContent(note.content, 120)))}</p>
          </div>
        </div>
      </div>
      
      <div class="card-footer note-actions" style="display: none;">
        <button class="btn btn-ghost btn-sm action-btn edit-btn" aria-label="Edit todo" title="Edit">
          <span aria-hidden="true">✏️</span> Edit
        </button>
        <button class="btn btn-destructive btn-sm action-btn delete-btn" aria-label="Delete todo" title="Delete">
          <span aria-hidden="true">🗑️</span> Delete
        </button>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="card-header note-header">
        <div class="note-tags">
          <span class="badge badge-note">Note</span>
          ${tagsHtml}
        </div>
        <div class="note-meta">
          <time class="note-timestamp" datetime="${note.createdAt}">${relativeTime}</time>
          <button class="btn btn-ghost btn-icon note-actions-btn" aria-label="Note actions">
            <span aria-hidden="true">⋮</span>
          </button>
        </div>
      </div>
      
      <div class="card-content note-content">
        <h3 class="card-title note-title">${this.escapeHtml(note.title || this.generateTitle(note.content))}</h3>
        <p class="note-body">${this.highlightSearchTerm(this.escapeHtml(this.truncateContent(note.content, 150)))}</p>
      </div>
      
      <div class="card-footer note-actions" style="display: none;">
        <button class="btn btn-ghost btn-sm action-btn edit-btn" aria-label="Edit note" title="Edit">
          <span aria-hidden="true">✏️</span> Edit
        </button>
        <button class="btn btn-destructive btn-sm action-btn delete-btn" aria-label="Delete note" title="Delete">
          <span aria-hidden="true">🗑️</span> Delete
        </button>
      </div>
    `;
  }
  
  // Add event listeners
  this.bindNoteCardEvents(card, note);
  
  return card;
};

// Update the bindNoteCardEvents to handle the new structure
NotesApp.prototype.bindNoteCardEvents = function(card, note) {
  const editBtn = card.querySelector('.edit-btn');
  const deleteBtn = card.querySelector('.delete-btn');
  const actionsBtn = card.querySelector('.note-actions-btn');
  const actions = card.querySelector('.note-actions');
  const todoCheckbox = card.querySelector('.todo-checkbox');
  
  // Show/hide actions on hover or when actions button is clicked
  if (actionsBtn) {
    actionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = actions.style.display !== 'none';
      actions.style.display = isVisible ? 'none' : 'flex';
    });
  }
  
  // Card hover to show actions (for desktop)
  card.addEventListener('mouseenter', () => {
    if (window.innerWidth > 768) {
      actions.style.display = 'flex';
    }
  });
  
  card.addEventListener('mouseleave', () => {
    if (window.innerWidth > 768 && !actionsBtn) {
      actions.style.display = 'none';
    }
  });
  
  // Card click to view/edit
  card.addEventListener('click', (e) => {
    if (e.target === card || e.target.classList.contains('note-content') || e.target.classList.contains('note-title') || e.target.classList.contains('note-body')) {
      this.editNote(note);
    }
  });
  
  // Edit button
  editBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    this.editNote(note);
  });
  
  // Delete button
  deleteBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    this.confirmDelete(note);
  });
  
  // Todo checkbox
  todoCheckbox?.addEventListener('change', (e) => {
    e.stopPropagation();
    this.updateNote(note.id, {
      ...note,
      isCompleted: e.target.checked
    });
  });
  
  // Keyboard navigation
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.editNote(note);
    } else if (e.key === 'Delete' && e.ctrlKey) {
      e.preventDefault();
      this.confirmDelete(note);
    }
  });
};

// Helper function to generate relative time
NotesApp.prototype.getRelativeTime = function(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
};