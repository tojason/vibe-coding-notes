/**
 * Vibe Coding Notes - Main Application Script
 * 
 * A comprehensive note-taking application for developers
 * Features: Note CRUD, Search/Filter, localStorage persistence, Theme switching
 * Accessibility: Full keyboard navigation, screen reader support
 * Performance: Debounced search, efficient DOM manipulation
 */

// ==========================================================================
// Application State Management
// ==========================================================================

class NotesApp {
  constructor() {
    this.notes = [];
    this.filteredNotes = [];
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.activeTagFilters = new Set();
    this.editingNoteId = null;
    this.isLoading = false;
    
    // DOM elements cache
    this.elements = {};
    
    // Debounced functions
    this.debouncedSearch = this.debounce(this.performSearch.bind(this), 300);
    this.debouncedAutoSave = this.debounce(this.autoSaveDraft.bind(this), 1000);
    
    // Initialize application
    this.init();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  init() {
    this.cacheElements();
    this.loadNotes();
    this.loadTheme();
    this.bindEvents();
    this.renderNotes();
    this.updateSearchInfo();
    
    // Set focus to search input for keyboard-first workflow
    if (this.elements.searchInput) {
      this.elements.searchInput.focus();
    }
    
    console.log('Vibe Coding Notes app initialized');
  }

  cacheElements() {
    // Main elements
    this.elements.notesGrid = document.getElementById('notes-grid');
    this.elements.searchInput = document.getElementById('search-input');
    this.elements.searchResultsInfo = document.getElementById('search-results-info');
    this.elements.tagFilters = document.getElementById('tag-filters');
    this.elements.clearFilters = document.getElementById('clear-filters');
    
    // Modal elements
    this.elements.modalOverlay = document.getElementById('modal-overlay');
    this.elements.modalTitle = document.getElementById('modal-title');
    this.elements.modalClose = document.getElementById('modal-close');
    this.elements.noteForm = document.getElementById('note-form');
    this.elements.noteTitle = document.getElementById('note-title');
    this.elements.noteContent = document.getElementById('note-content');
    this.elements.noteTags = document.getElementById('note-tags');
    this.elements.saveBtn = document.getElementById('save-btn');
    this.elements.cancelBtn = document.getElementById('cancel-btn');
    this.elements.formErrors = document.getElementById('form-errors');
    this.elements.charCount = document.getElementById('char-count');
    this.elements.tagSuggestions = document.getElementById('tag-suggestions');
    
    // Confirmation modal
    this.elements.confirmModalOverlay = document.getElementById('confirm-modal-overlay');
    this.elements.confirmTitle = document.getElementById('confirm-title');
    this.elements.confirmDescription = document.getElementById('confirm-description');
    this.elements.confirmAction = document.getElementById('confirm-action');
    this.elements.confirmCancel = document.getElementById('confirm-cancel');
    
    // Other elements
    this.elements.addNoteCard = document.getElementById('add-note-card');
    this.elements.themeToggle = document.getElementById('theme-toggle');
    this.elements.exportBtn = document.getElementById('export-btn');
    this.elements.emptyState = document.getElementById('empty-state');
    this.elements.noResultsState = document.getElementById('no-results-state');
    this.elements.emptyCta = document.getElementById('empty-cta');
    this.elements.clearSearch = document.getElementById('clear-search');
    this.elements.toastContainer = document.getElementById('toast-container');
    this.elements.loadingOverlay = document.getElementById('loading-overlay');
  }

  // ==========================================================================
  // Event Binding
  // ==========================================================================

  bindEvents() {
    // Add note card click
    this.elements.addNoteCard?.addEventListener('click', () => this.openAddNoteModal());
    this.elements.addNoteCard?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openAddNoteModal();
      }
    });

    // Search input
    this.elements.searchInput?.addEventListener('input', (e) => {
      this.currentSearch = e.target.value;
      this.debouncedSearch();
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.setTimeFilter(e.target.dataset.filter);
      });
    });

    // Clear filters
    this.elements.clearFilters?.addEventListener('click', () => this.clearAllFilters());

    // Modal events
    this.elements.modalClose?.addEventListener('click', () => this.closeModal());
    this.elements.cancelBtn?.addEventListener('click', () => this.closeModal());
    this.elements.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.modalOverlay) {
        this.closeModal();
      }
    });

    // Form submission
    this.elements.noteForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNote();
    });

    // Content character count
    this.elements.noteContent?.addEventListener('input', (e) => {
      this.updateCharacterCount();
      this.debouncedAutoSave();
    });

    // Tag input and suggestions
    this.elements.noteTags?.addEventListener('input', () => this.updateTagSuggestions());

    // Theme toggle
    this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());

    // Export button
    this.elements.exportBtn?.addEventListener('click', () => this.exportNotes());

    // Empty state CTA
    this.elements.emptyCta?.addEventListener('click', () => this.openAddNoteModal());

    // Clear search
    this.elements.clearSearch?.addEventListener('click', () => this.clearSearch());

    // Confirmation modal
    this.elements.confirmCancel?.addEventListener('click', () => this.closeConfirmModal());
    this.elements.confirmModalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.confirmModalOverlay) {
        this.closeConfirmModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Global click handler to close note actions when clicking outside
    document.addEventListener('click', (e) => {
      // Don't close if clicking on action buttons or menus
      if (!e.target.closest('.note-actions') && !e.target.closest('.note-actions-btn')) {
        this.closeAllNoteActions();
      }
    });

    // Window events
    window.addEventListener('beforeunload', () => this.saveDraftOnUnload());
    
    // Handle system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme-preference')) {
          this.updateTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  // ==========================================================================
  // Data Management
  // ==========================================================================

  loadNotes() {
    try {
      const savedNotes = localStorage.getItem('vibe-coding-notes');
      if (savedNotes) {
        this.notes = JSON.parse(savedNotes);
        // Ensure all notes have required properties
        this.notes = this.notes.map(note => ({
          id: note.id || this.generateId(),
          title: note.title || '',
          content: note.content || '',
          tags: Array.isArray(note.tags) ? note.tags : [],
          createdAt: note.createdAt || new Date().toISOString(),
          updatedAt: note.updatedAt || note.createdAt || new Date().toISOString()
        }));
        this.saveNotes(); // Save normalized data
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      this.showToast('Error loading notes', 'error');
      this.notes = [];
    }
    
    this.applyFilters();
  }

  saveNotes() {
    try {
      localStorage.setItem('vibe-coding-notes', JSON.stringify(this.notes));
    } catch (error) {
      console.error('Error saving notes:', error);
      this.showToast('Error saving notes', 'error');
    }
  }

  addNote(noteData) {
    const note = {
      id: this.generateId(),
      title: noteData.title.trim(),
      content: noteData.content,
      tags: this.parseTags(noteData.tags),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notes.unshift(note); // Add to beginning for chronological order
    this.saveNotes();
    this.applyFilters();
    this.renderNotes();
    this.updateSearchInfo();
    this.updateTagFilters();
    
    return note;
  }

  updateNote(id, noteData) {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    if (noteIndex === -1) return null;

    const updatedNote = {
      ...this.notes[noteIndex],
      title: noteData.title.trim(),
      content: noteData.content,
      tags: this.parseTags(noteData.tags),
      updatedAt: new Date().toISOString()
    };

    this.notes[noteIndex] = updatedNote;
    this.saveNotes();
    this.applyFilters();
    this.renderNotes();
    this.updateSearchInfo();
    this.updateTagFilters();
    
    return updatedNote;
  }

  deleteNote(id) {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    if (noteIndex === -1) return false;

    this.notes.splice(noteIndex, 1);
    this.saveNotes();
    this.applyFilters();
    this.renderNotes();
    this.updateSearchInfo();
    this.updateTagFilters();
    
    return true;
  }

  // ==========================================================================
  // Search and Filtering
  // ==========================================================================

  performSearch() {
    this.applyFilters();
    this.renderNotes();
    this.updateSearchInfo();
  }

  applyFilters() {
    let filtered = [...this.notes];

    // Apply time filter
    if (this.currentFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (this.currentFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (this.currentFilter !== 'all') {
        filtered = filtered.filter(note => new Date(note.createdAt) >= filterDate);
      }
    }

    // Apply tag filters
    if (this.activeTagFilters.size > 0) {
      filtered = filtered.filter(note => 
        [...this.activeTagFilters].some(tag => note.tags.includes(tag))
      );
    }

    // Apply search filter
    if (this.currentSearch.trim()) {
      const searchTerm = this.currentSearch.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    this.filteredNotes = filtered;
  }

  setTimeFilter(filter) {
    this.currentFilter = filter;
    
    // Update filter chip states
    document.querySelectorAll('.filter-chip').forEach(chip => {
      const isActive = chip.dataset.filter === filter;
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-pressed', isActive);
    });

    this.applyFilters();
    this.renderNotes();
    this.updateSearchInfo();
    this.updateClearFiltersVisibility();
  }

  toggleTagFilter(tag) {
    if (this.activeTagFilters.has(tag)) {
      this.activeTagFilters.delete(tag);
    } else {
      this.activeTagFilters.add(tag);
    }

    this.applyFilters();
    this.renderNotes();
    this.updateSearchInfo();
    this.updateTagFilters();
    this.updateClearFiltersVisibility();
  }

  clearAllFilters() {
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.activeTagFilters.clear();
    
    // Reset UI
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    
    document.querySelectorAll('.filter-chip').forEach(chip => {
      const isAll = chip.dataset.filter === 'all';
      chip.classList.toggle('active', isAll);
      chip.setAttribute('aria-pressed', isAll);
    });

    this.applyFilters();
    this.renderNotes();
    this.updateSearchInfo();
    this.updateTagFilters();
    this.updateClearFiltersVisibility();
  }

  clearSearch() {
    this.currentSearch = '';
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
      this.elements.searchInput.focus();
    }
    this.performSearch();
  }

  // ==========================================================================
  // Note Actions Management
  // ==========================================================================

  closeAllNoteActions() {
    // Find all visible note action menus and hide them
    const openActions = document.querySelectorAll('.note-actions[style*="flex"]');
    openActions.forEach(actions => {
      actions.style.display = 'none';
    });
  }

  // ==========================================================================
  // UI Rendering
  // ==========================================================================

  renderNotes() {
    if (!this.elements.notesGrid) return;

    // Clear existing note cards (keep add note card)
    const existingNotes = this.elements.notesGrid.querySelectorAll('.note-card');
    existingNotes.forEach(card => card.remove());

    // Show/hide empty states
    const hasNotes = this.notes.length > 0;
    const hasFilteredResults = this.filteredNotes.length > 0;
    
    if (this.elements.emptyState) {
      this.elements.emptyState.style.display = hasNotes ? 'none' : 'block';
    }
    
    if (this.elements.noResultsState) {
      this.elements.noResultsState.style.display = 
        hasNotes && !hasFilteredResults && (this.currentSearch || this.currentFilter !== 'all' || this.activeTagFilters.size > 0) 
          ? 'block' : 'none';
    }

    // Hide add note card if no notes exist (empty state handles this)
    if (this.elements.addNoteCard) {
      this.elements.addNoteCard.style.display = hasNotes ? 'flex' : 'none';
    }

    // Render filtered notes
    this.filteredNotes.forEach((note, index) => {
      const noteCard = this.createNoteCard(note, index);
      this.elements.notesGrid.appendChild(noteCard);
    });

    // Announce to screen readers
    this.announceSearchResults();
  }

  createNoteCard(note, index) {
    const card = document.createElement('article');
    card.className = 'note-card slide-up';
    card.dataset.noteId = note.id;
    card.tabIndex = 0;
    card.style.animationDelay = `${index * 50}ms`;
    
    // Highlight search results
    if (this.currentSearch) {
      card.classList.add('highlighted');
    }

    // Add class for content-only notes
    if (!note.title.trim()) {
      card.classList.add('content-only');
    }

    card.innerHTML = `
      <header class="note-header ${note.tags.length === 0 ? 'no-tags' : ''}">
        ${note.tags.length > 0 ? `
          <div class="note-tags">
            ${note.tags.map(tag => `
              <span class="note-tag ${this.getTagClass(tag)}">${this.escapeHtml(tag)}</span>
            `).join('')}
          </div>
        ` : ''}
        <div class="note-meta">
          <time class="note-timestamp" datetime="${note.createdAt}" title="${this.formatFullDate(note.createdAt)}">
            ${this.formatRelativeTime(note.createdAt)}
          </time>
          <button class="note-actions-btn" aria-label="Note actions" title="Actions">⋮</button>
        </div>
      </header>
      
      <div class="note-content">
        <time class="note-date" datetime="${note.createdAt}" title="${this.formatFullDate(note.createdAt)}">
          ${this.formatFriendlyDate(note.createdAt)}
        </time>
        ${note.title.trim() ? `<h3 class="note-title">${this.highlightSearchTerm(this.escapeHtml(note.title))}</h3>` : ''}
        <p class="note-body">${this.highlightSearchTerm(this.escapeHtml(this.truncateContent(note.content, 150)))}</p>
      </div>
      
      <div class="note-actions" style="display: none;">
        <button class="action-btn edit-btn" aria-label="Edit note" title="Edit">✏️</button>
        <button class="action-btn delete-btn" aria-label="Delete note" title="Delete">🗑️</button>
      </div>
    `;

    // Add event listeners
    this.bindNoteCardEvents(card, note);

    return card;
  }

  bindNoteCardEvents(card, note) {
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    const actionsBtn = card.querySelector('.note-actions-btn');
    const actions = card.querySelector('.note-actions');

    // Edit button
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditNoteModal(note);
    });

    // Delete button
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirmDeleteNote(note.id);
    });

    // Actions toggle
    actionsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Close all other open action menus first
      this.closeAllNoteActions();
      
      // Toggle this action menu
      const isVisible = actions.style.display !== 'none';
      actions.style.display = isVisible ? 'none' : 'flex';
    });

    // Card click (read full note)
    card.addEventListener('click', () => {
      this.openViewNoteModal(note);
    });

    // Keyboard navigation
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openViewNoteModal(note);
      }
    });

    // Tag clicks
    card.querySelectorAll('.note-tag').forEach(tagEl => {
      tagEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = tagEl.textContent;
        this.toggleTagFilter(tag);
      });
    });
  }

  // ==========================================================================
  // Modal Management
  // ==========================================================================

  openAddNoteModal() {
    this.editingNoteId = null;
    this.elements.modalTitle.textContent = 'Add New Note';
    this.elements.saveBtn.innerHTML = '<span class="btn-text">Save Note</span><span class="btn-loading" style="display: none;">Saving...</span>';
    
    // Clear any existing draft to ensure clean slate
    this.clearDraft();
    
    // Clear form
    this.elements.noteTitle.value = '';
    this.elements.noteContent.value = '';
    this.elements.noteTags.value = '';
    this.clearFormErrors();
    this.updateCharacterCount();
    
    this.showModal();
    this.elements.noteContent.focus();
  }

  openEditNoteModal(note) {
    this.editingNoteId = note.id;
    this.elements.modalTitle.textContent = 'Edit Note';
    this.elements.saveBtn.innerHTML = '<span class="btn-text">Update Note</span><span class="btn-loading" style="display: none;">Updating...</span>';
    
    // Populate form
    this.elements.noteTitle.value = note.title;
    this.elements.noteContent.value = note.content;
    this.elements.noteTags.value = note.tags.join(', ');
    this.clearFormErrors();
    this.updateCharacterCount();
    
    this.showModal();
    this.elements.noteContent.focus();
    this.elements.noteContent.setSelectionRange(note.content.length, note.content.length);
  }

  openViewNoteModal(note) {
    // For now, just open edit modal
    // In the future, this could be a read-only view
    this.openEditNoteModal(note);
  }

  showModal() {
    this.elements.modalOverlay.style.display = 'flex';
    this.elements.modalOverlay.setAttribute('aria-hidden', 'false');
    
    // Animate in
    requestAnimationFrame(() => {
      this.elements.modalOverlay.classList.add('show');
    });
    
    // Trap focus
    this.trapFocus(this.elements.modalOverlay);
  }

  closeModal() {
    // Save draft before closing
    if (this.elements.noteContent.value.trim()) {
      this.saveDraft();
    } else {
      this.clearDraft();
    }
    
    this.elements.modalOverlay.classList.remove('show');
    
    setTimeout(() => {
      this.elements.modalOverlay.style.display = 'none';
      this.elements.modalOverlay.setAttribute('aria-hidden', 'true');
      this.editingNoteId = null;
      
      // Return focus to add note card or search input
      if (this.elements.addNoteCard.style.display !== 'none') {
        this.elements.addNoteCard.focus();
      } else {
        this.elements.searchInput?.focus();
      }
    }, 300);
  }

  // ==========================================================================
  // Note Operations
  // ==========================================================================

  saveNote() {
    const content = this.elements.noteContent.value.trim();
    const title = this.elements.noteTitle.value.trim();
    const tags = this.elements.noteTags.value.trim();

    // Validate
    if (!this.validateForm(content)) {
      return;
    }

    // Show loading state
    this.elements.saveBtn.classList.add('btn-loading');
    this.elements.saveBtn.querySelector('.btn-text').style.display = 'none';
    this.elements.saveBtn.querySelector('.btn-loading').style.display = 'inline';
    this.elements.saveBtn.disabled = true;

    // Simulate async operation
    setTimeout(() => {
      const noteData = { title, content, tags };

      if (this.editingNoteId) {
        // Update existing note
        const updatedNote = this.updateNote(this.editingNoteId, noteData);
        if (updatedNote) {
          this.showToast('Note updated successfully!', 'success');
        }
      } else {
        // Create new note
        const newNote = this.addNote(noteData);
        this.showToast('Note saved successfully!', 'success');
      }

      // Clear draft and close modal
      this.clearDraft();
      this.closeModal();

      // Reset button state
      this.elements.saveBtn.classList.remove('btn-loading');
      this.elements.saveBtn.querySelector('.btn-text').style.display = 'inline';
      this.elements.saveBtn.querySelector('.btn-loading').style.display = 'none';
      this.elements.saveBtn.disabled = false;
    }, 500);
  }

  confirmDeleteNote(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    this.elements.confirmTitle.textContent = 'Delete Note';
    this.elements.confirmDescription.textContent = 
      `Are you sure you want to delete "${note.title}"? This action cannot be undone.`;
    this.elements.confirmAction.textContent = 'Delete Note';
    this.elements.confirmAction.className = 'btn btn-danger';

    // Show confirmation modal
    this.elements.confirmModalOverlay.style.display = 'flex';
    this.elements.confirmAction.focus();

    // Handle confirmation
    const handleConfirm = () => {
      if (this.deleteNote(noteId)) {
        this.showToast('Note deleted successfully', 'success');
      }
      this.closeConfirmModal();
      cleanup();
    };

    const handleCancel = () => {
      this.closeConfirmModal();
      cleanup();
    };

    const cleanup = () => {
      this.elements.confirmAction.removeEventListener('click', handleConfirm);
      this.elements.confirmCancel.removeEventListener('click', handleCancel);
    };

    this.elements.confirmAction.addEventListener('click', handleConfirm);
    this.elements.confirmCancel.addEventListener('click', handleCancel);
  }

  closeConfirmModal() {
    this.elements.confirmModalOverlay.style.display = 'none';
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================

  loadTheme() {
    const savedTheme = localStorage.getItem('theme-preference');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    this.updateTheme(theme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    this.updateTheme(newTheme);
    localStorage.setItem('theme-preference', newTheme);
  }

  updateTheme(theme) {
    document.documentElement.dataset.theme = theme;
    
    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#1E293B' : '#3B82F6';
    }
  }

  // ==========================================================================
  // Data Import/Export
  // ==========================================================================

  exportNotes() {
    if (this.notes.length === 0) {
      this.showToast('No notes to export', 'error');
      return;
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      notes: this.notes
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-coding-notes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast(`Exported ${this.notes.length} notes successfully!`, 'success');
  }

  // ==========================================================================
  // Draft Management
  // ==========================================================================

  saveDraft() {
    const draft = {
      title: this.elements.noteTitle.value,
      content: this.elements.noteContent.value,
      tags: this.elements.noteTags.value,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('note-draft', JSON.stringify(draft));
  }

  loadDraft() {
    try {
      const savedDraft = localStorage.getItem('note-draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        
        // Only load if not editing existing note
        if (!this.editingNoteId) {
          this.elements.noteTitle.value = draft.title || '';
          this.elements.noteContent.value = draft.content || '';
          this.elements.noteTags.value = draft.tags || '';
          this.updateCharacterCount();
          
          if (draft.content) {
            this.showToast('Draft restored', 'success');
          }
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }

  clearDraft() {
    localStorage.removeItem('note-draft');
  }

  autoSaveDraft() {
    if (this.elements.noteContent.value.trim() && !this.editingNoteId) {
      this.saveDraft();
    }
  }

  saveDraftOnUnload() {
    if (this.elements.noteContent?.value.trim()) {
      this.saveDraft();
    }
  }

  // ==========================================================================
  // Form Validation & Helpers
  // ==========================================================================

  validateForm(content) {
    this.clearFormErrors();
    const errors = [];

    if (!content) {
      errors.push('Note content is required');
    } else if (content.length < 3) {
      errors.push('Note content must be at least 3 characters');
    } else if (content.length > 2000) {
      errors.push('Note content must be less than 2000 characters');
    }

    if (errors.length > 0) {
      this.showFormErrors(errors);
      return false;
    }

    return true;
  }

  showFormErrors(errors) {
    this.elements.formErrors.innerHTML = errors.map(error => 
      `<div>${this.escapeHtml(error)}</div>`
    ).join('');
    this.elements.formErrors.style.display = 'block';
    this.elements.formErrors.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  clearFormErrors() {
    this.elements.formErrors.style.display = 'none';
    this.elements.formErrors.innerHTML = '';
  }

  updateCharacterCount() {
    const content = this.elements.noteContent.value;
    const count = content.length;
    this.elements.charCount.textContent = count;
    
    const counter = this.elements.charCount.parentElement;
    counter.className = 'character-count';
    
    if (count > 1800) {
      counter.classList.add('error');
    } else if (count > 1500) {
      counter.classList.add('warning');
    }
  }

  updateTagSuggestions() {
    // Get all existing tags
    const allTags = [...new Set(this.notes.flatMap(note => note.tags))];
    const currentInput = this.elements.noteTags.value.toLowerCase();
    const currentTags = this.parseTags(this.elements.noteTags.value);
    
    // Filter suggestions
    const suggestions = allTags.filter(tag => 
      tag.toLowerCase().includes(currentInput) && 
      !currentTags.includes(tag)
    ).slice(0, 8);

    if (suggestions.length > 0) {
      this.elements.tagSuggestions.innerHTML = suggestions.map(tag => 
        `<span class="tag-suggestion" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`
      ).join('');
      this.elements.tagSuggestions.style.display = 'block';
      
      // Bind click events
      this.elements.tagSuggestions.querySelectorAll('.tag-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
          const tag = suggestion.dataset.tag;
          this.addTagToInput(tag);
        });
      });
    } else {
      this.elements.tagSuggestions.style.display = 'none';
    }
  }

  addTagToInput(tag) {
    const currentTags = this.parseTags(this.elements.noteTags.value);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      this.elements.noteTags.value = newTags;
      this.elements.tagSuggestions.style.display = 'none';
    }
  }

  // ==========================================================================
  // Tag Management
  // ==========================================================================

  updateTagFilters() {
    if (!this.elements.tagFilters) return;

    // Get all unique tags from notes
    const allTags = [...new Set(this.notes.flatMap(note => note.tags))];
    
    this.elements.tagFilters.innerHTML = allTags.map(tag => `
      <button class="filter-chip ${this.activeTagFilters.has(tag) ? 'active' : ''}" 
              data-tag="${this.escapeHtml(tag)}"
              aria-pressed="${this.activeTagFilters.has(tag)}">
        ${this.escapeHtml(tag)}
      </button>
    `).join('');

    // Bind events
    this.elements.tagFilters.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.toggleTagFilter(chip.dataset.tag);
      });
    });
  }

  updateClearFiltersVisibility() {
    const hasActiveFilters = this.currentFilter !== 'all' || 
                           this.currentSearch.trim() || 
                           this.activeTagFilters.size > 0;
    
    if (this.elements.clearFilters) {
      this.elements.clearFilters.style.display = hasActiveFilters ? 'block' : 'none';
    }
  }

  // ==========================================================================
  // Search Info & Announcements
  // ==========================================================================

  updateSearchInfo() {
    if (!this.elements.searchResultsInfo) return;

    const total = this.notes.length;
    const filtered = this.filteredNotes.length;
    
    let message = '';
    
    if (total === 0) {
      message = 'No notes yet';
    } else if (this.currentSearch.trim() || this.currentFilter !== 'all' || this.activeTagFilters.size > 0) {
      message = `Showing ${filtered} of ${total} notes`;
    } else {
      message = `${total} note${total === 1 ? '' : 's'}`;
    }

    this.elements.searchResultsInfo.textContent = message;
  }

  announceSearchResults() {
    // Create announcement for screen readers
    const announcement = this.filteredNotes.length === 1 
      ? '1 note found' 
      : `${this.filteredNotes.length} notes found`;
    
    // Use existing search info element for announcement
    this.elements.searchResultsInfo.setAttribute('aria-live', 'polite');
  }

  // ==========================================================================
  // Keyboard Shortcuts
  // ==========================================================================

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N: New note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      this.openAddNoteModal();
      return;
    }

    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      this.elements.searchInput?.focus();
      return;
    }

    // Escape: Close modal, clear search, or close note actions
    if (e.key === 'Escape') {
      if (this.elements.modalOverlay.style.display === 'flex') {
        this.closeModal();
      } else if (this.elements.confirmModalOverlay.style.display === 'flex') {
        this.closeConfirmModal();
      } else if (this.currentSearch) {
        this.clearSearch();
      } else {
        // Close any open note action menus
        this.closeAllNoteActions();
      }
      return;
    }

    // Enter: Save note (when in modal)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && 
        this.elements.modalOverlay.style.display === 'flex') {
      e.preventDefault();
      this.saveNote();
      return;
    }
  }

  // ==========================================================================
  // Accessibility Helpers
  // ==========================================================================

  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // ==========================================================================
  // Toast Notifications
  // ==========================================================================

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    
    const icon = type === 'success' ? '✅' : '❌';
    
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${this.escapeHtml(message)}</span>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">✕</button>
    `;

    // Add close functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.removeToast(toast);
    });

    // Add to container
    this.elements.toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeToast(toast);
    }, 5000);
  }

  removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateTitle(content) {
    if (!content) return 'Untitled Note';
    
    // Clean content and get first meaningful sentence
    const cleaned = content.replace(/[#*`]/g, '').trim();
    const firstLine = cleaned.split('\n')[0];
    const truncated = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    
    return truncated || 'Untitled Note';
  }

  parseTags(tagString) {
    if (!tagString) return [];
    
    return tagString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }

  getTagClass(tag) {
    // Map common tags to semantic classes
    const tagMap = {
      'mcp-tool': 'mcp-tool',
      'mcp': 'mcp-tool',
      'best-practice': 'best-practice',
      'practice': 'best-practice',
      'debugging': 'debugging',
      'debug': 'debugging',
      'workflow': 'workflow',
      'learning': 'learning',
      'learn': 'learning'
    };
    
    return tagMap[tag.toLowerCase()] || '';
  }

  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  formatFullDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  formatFriendlyDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const noteDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - noteDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Show day of week for this week
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else if (date.getFullYear() === now.getFullYear()) {
      // Same year: show "Jan 15"
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // Different year: show "Jan 15, 2024"
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  truncateContent(content, maxLength) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }

  highlightSearchTerm(text) {
    if (!this.currentSearch.trim()) return text;
    
    const searchTerm = this.escapeHtml(this.currentSearch);
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// ==========================================================================
// Application Initialization
// ==========================================================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.vibeNotesApp = new NotesApp();
  });
} else {
  window.vibeNotesApp = new NotesApp();
}

// Service Worker Registration (for future PWA features)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Performance monitoring
if (window.performance && window.performance.mark) {
  window.performance.mark('app-init-start');
  
  window.addEventListener('load', () => {
    window.performance.mark('app-init-end');
    window.performance.measure('app-init', 'app-init-start', 'app-init-end');
    
    const initTime = window.performance.getEntriesByName('app-init')[0];
    console.log(`App initialization took ${initTime.duration.toFixed(2)}ms`);
  });
}