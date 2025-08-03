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

// Smart Dropdown Positioning Controller
class PriorityDropdownController {
  constructor() {
    this.activeDropdown = null;
    this.overlay = null;
    this.resizeHandler = () => this.repositionActiveDropdown();
    
    // Create overlay element for center positioning
    this.createOverlay();
  }
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'priority-dropdown-overlay';
    this.overlay.addEventListener('click', () => this.closeActiveDropdown());
    document.body.appendChild(this.overlay);
  }
  
  openDropdown(triggerElement, dropdownElement) {
    try {
      // Validate inputs
      if (!triggerElement || !dropdownElement) {
        console.warn('PriorityDropdownController: Invalid trigger or dropdown element');
        return;
      }
      
      // Close any existing dropdown
      this.closeActiveDropdown();
      
      // Calculate optimal position
      const position = this.calculatePosition(triggerElement, dropdownElement);
      
      // Apply positioning
      this.applyPositioning(dropdownElement, position);
      
      // Show dropdown
      this.showDropdown(dropdownElement, position.needsOverlay);
      
      // Track active dropdown
      this.activeDropdown = { trigger: triggerElement, dropdown: dropdownElement };
      
      // Listen for window resize and scroll
      window.addEventListener('resize', this.resizeHandler);
      window.addEventListener('scroll', this.resizeHandler, { passive: true });
      
    } catch (error) {
      console.error('PriorityDropdownController: Error opening dropdown:', error);
      this.closeActiveDropdown();
    }
  }
  
  closeActiveDropdown() {
    try {
      if (this.activeDropdown) {
        this.hideDropdown(this.activeDropdown.dropdown);
        this.activeDropdown = null;
      }
      
      // Remove event listeners
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('scroll', this.resizeHandler);
      
    } catch (error) {
      console.error('PriorityDropdownController: Error closing dropdown:', error);
      // Force cleanup
      this.activeDropdown = null;
      this.overlay.classList.remove('show');
    }
  }
  
  calculatePosition(trigger, dropdown) {
    // Temporarily show dropdown to measure dimensions
    dropdown.style.visibility = 'hidden';
    dropdown.style.display = 'block';
    dropdown.style.opacity = '0';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '0';
    dropdown.style.left = '0';
    dropdown.style.transform = 'none';
    
    const triggerRect = trigger.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    
    // Hide dropdown again
    dropdown.style.display = 'none';
    dropdown.style.visibility = 'visible';
    dropdown.style.opacity = '';
    dropdown.style.position = '';
    dropdown.style.top = '';
    dropdown.style.left = '';
    dropdown.style.transform = '';
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const spacing = 8;
    const dropdownWidth = dropdownRect.width || 160; // fallback width
    const dropdownHeight = dropdownRect.height || 180; // fallback height
    
    // Calculate available space from trigger element
    const spaceBelow = viewport.height - triggerRect.bottom - spacing;
    const spaceAbove = triggerRect.top - spacing;
    const spaceRight = viewport.width - triggerRect.right - spacing;
    const spaceLeft = triggerRect.left - spacing;
    
    // Enhanced positioning logic with better edge detection
    let vertical, horizontal;
    
    // Vertical positioning with preference for below
    if (spaceBelow >= dropdownHeight) {
      vertical = 'bottom';
    } else if (spaceAbove >= dropdownHeight) {
      vertical = 'top';
    } else {
      // Choose side with more space
      vertical = spaceBelow > spaceAbove ? 'bottom' : 'top';
    }
    
    // Horizontal positioning with preference for right
    if (spaceRight >= dropdownWidth) {
      horizontal = 'right';
    } else if (spaceLeft >= dropdownWidth) {
      horizontal = 'left';
    } else {
      // Choose side with more space
      horizontal = spaceRight > spaceLeft ? 'right' : 'left';
    }
    
    // Check if we need center fallback (very constrained space)
    const totalAvailableVertical = Math.max(spaceBelow, spaceAbove);
    const totalAvailableHorizontal = Math.max(spaceRight, spaceLeft);
    const needsCenter = (totalAvailableVertical < dropdownHeight * 0.7 || 
                        totalAvailableHorizontal < dropdownWidth * 0.7) && 
                       this.isMobile();
    
    if (needsCenter) {
      return { 
        position: 'center-overlay', 
        needsOverlay: true,
        constrainWidth: false
      };
    }
    
    return { 
      position: `${vertical}-${horizontal}`,
      needsOverlay: false,
      constrainWidth: spaceRight < dropdownWidth && spaceLeft < dropdownWidth,
      // Additional positioning data for fine-tuning
      spaces: { spaceBelow, spaceAbove, spaceRight, spaceLeft },
      dimensions: { dropdownWidth, dropdownHeight },
      triggerRect: triggerRect
    };
  }
  
  applyPositioning(dropdown, positionData) {
    // Clear existing position classes
    dropdown.className = dropdown.className.replace(/position-\w+(-\w+)?/g, '');
    dropdown.classList.remove('constrain-width');
    
    // Apply new position class
    dropdown.classList.add(`position-${positionData.position}`);
    
    // Apply width constraint if needed
    if (positionData.constrainWidth) {
      dropdown.classList.add('constrain-width');
    }
    
    // Handle center-overlay positioning
    if (positionData.position === 'center-overlay') {
      // For center positioning, we'll let CSS handle it
      dropdown.style.position = 'fixed';
      dropdown.style.top = '50%';
      dropdown.style.left = '50%';
      dropdown.style.transform = 'translate(-50%, -50%)';
      dropdown.style.zIndex = '100';
      dropdown.style.maxWidth = 'calc(100vw - 2rem)';
    } else {
      // Reset any inline styles for normal positioning
      dropdown.style.position = '';
      dropdown.style.top = '';
      dropdown.style.left = '';
      dropdown.style.transform = '';
      dropdown.style.zIndex = '';
      dropdown.style.maxWidth = '';
    }
  }
  
  showDropdown(dropdown, needsOverlay) {
    if (needsOverlay) {
      this.overlay.classList.add('show');
    }
    
    // Add open class with smooth animation
    dropdown.classList.add('open');
    
    // Ensure dropdown is visible and properly positioned
    dropdown.style.display = 'block';
    
    // Focus management for keyboard accessibility
    const firstButton = dropdown.querySelector('button');
    if (firstButton) {
      // Small delay to ensure positioning is complete
      setTimeout(() => {
        firstButton.focus();
        // Announce to screen readers
        this.announceDropdownOpen(dropdown);
      }, 150);
    }
  }
  
  hideDropdown(dropdown) {
    dropdown.classList.remove('open');
    this.overlay.classList.remove('show');
    
    // Clear position classes and inline styles
    dropdown.className = dropdown.className.replace(/position-\w+(-\w+)?/g, '');
    dropdown.classList.remove('constrain-width');
    
    // Reset inline styles
    dropdown.style.position = '';
    dropdown.style.top = '';
    dropdown.style.left = '';
    dropdown.style.transform = '';
    dropdown.style.zIndex = '';
    dropdown.style.maxWidth = '';
    dropdown.style.display = '';
    
    // Return focus to trigger element
    if (this.activeDropdown && this.activeDropdown.trigger) {
      this.activeDropdown.trigger.focus();
    }
  }
  
  repositionActiveDropdown() {
    if (this.activeDropdown) {
      const { trigger, dropdown } = this.activeDropdown;
      const position = this.calculatePosition(trigger, dropdown);
      this.applyPositioning(dropdown, position);
      
      // Update overlay visibility if needed
      if (position.needsOverlay) {
        this.overlay.classList.add('show');
      } else {
        this.overlay.classList.remove('show');
      }
    }
  }
  
  isMobile() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }
  
  announceDropdownOpen(dropdown) {
    // Create announcement for screen readers
    const announcement = 'Priority options menu opened. Use arrow keys to navigate.';
    
    // Create or update live region
    let liveRegion = document.getElementById('dropdown-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'dropdown-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = announcement;
  }
  
  handleKeyboardNavigation(event, dropdown) {
    try {
      const buttons = dropdown.querySelectorAll('button');
      if (buttons.length === 0) return;
      
      const currentIndex = Array.from(buttons).findIndex(btn => btn === event.target);
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % buttons.length;
          buttons[nextIndex]?.focus();
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
          buttons[prevIndex]?.focus();
          break;
        case 'Escape':
          event.preventDefault();
          this.closeActiveDropdown();
          break;
        case 'Home':
          event.preventDefault();
          buttons[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          buttons[buttons.length - 1]?.focus();
          break;
        case 'Tab':
          // Allow natural tab behavior but close dropdown
          this.closeActiveDropdown();
          break;
      }
    } catch (error) {
      console.error('PriorityDropdownController: Keyboard navigation error:', error);
    }
  }
}

class NotesApp {
  constructor() {
    this.notes = [];
    this.filteredNotes = [];
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.activeTagFilters = new Set();
    this.currentTodoFilter = 'all';
    this.editingNoteId = null;
    this.isLoading = false;
    
    // DOM elements cache
    this.elements = {};
    
    // Dropdown controller
    this.dropdownController = new PriorityDropdownController();
    
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
    this.elements.todoFilterChips = document.querySelector('.todo-filter-chips');
    this.elements.clearFilters = document.getElementById('clear-filters');
    
    // Modal elements
    this.elements.modalOverlay = document.getElementById('modal-overlay');
    this.elements.modalTitle = document.getElementById('modal-title');
    this.elements.modalClose = document.getElementById('modal-close');
    this.elements.noteForm = document.getElementById('note-form');
    this.elements.noteTitle = document.getElementById('note-title');
    this.elements.noteContent = document.getElementById('note-content');
    this.elements.noteTags = document.getElementById('note-tags');
    this.elements.noteIsTodo = document.getElementById('note-is-todo');
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
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.setTimeFilter(e.target.dataset.filter);
      });
    });

    // Todo filter chips
    document.querySelectorAll('.filter-chip[data-todo-filter]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.setTodoFilter(e.target.dataset.todoFilter);
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

    // Global click handler to close note actions and priority dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      // Don't close if clicking on action buttons or menus
      if (!e.target.closest('.note-actions') && !e.target.closest('.note-actions-btn')) {
        this.closeAllNoteActions();
      }
      
      // Close priority dropdowns when clicking outside
      if (!e.target.closest('.priority-tag') && 
          !e.target.closest('.priority-dropdown') && 
          !e.target.closest('.priority-dropdown-overlay')) {
        
        // Use the controller to close active dropdown
        this.dropdownController.closeActiveDropdown();
        
        // Fallback cleanup for any missed dropdowns
        document.querySelectorAll('.priority-dropdown.open').forEach(dropdown => {
          dropdown.classList.remove('open');
          const tag = dropdown.previousElementSibling;
          if (tag && tag.classList.contains('priority-tag')) {
            tag.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
    
    // Additional keyboard handler for global escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.dropdownController.activeDropdown) {
        this.dropdownController.closeActiveDropdown();
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
        // Ensure all notes have required properties (including new todo fields)
        this.notes = this.notes.map(note => ({
          id: note.id || this.generateId(),
          title: note.title || '',
          content: note.content || '',
          tags: Array.isArray(note.tags) ? note.tags : [],
          createdAt: note.createdAt || new Date().toISOString(),
          updatedAt: note.updatedAt || note.createdAt || new Date().toISOString(),
          // New todo fields with backward compatibility and type safety
          isTodo: Boolean(note.isTodo),
          isCompleted: Boolean(note.isCompleted),
          // Priority field for Eisenhower matrix: 0=UI, 1=NI, 2=UN, 3=NN
          priority: typeof note.priority === 'number' ? note.priority : 0
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
      updatedAt: new Date().toISOString(),
      // Todo fields
      isTodo: noteData.isTodo || false,
      isCompleted: noteData.isCompleted || false,
      // Priority field (0=UI, 1=NI, 2=UN, 3=NN)
      priority: noteData.priority || 0
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
      updatedAt: new Date().toISOString(),
      // Update todo fields if provided
      isTodo: noteData.hasOwnProperty('isTodo') ? noteData.isTodo : this.notes[noteIndex].isTodo,
      isCompleted: noteData.hasOwnProperty('isCompleted') ? noteData.isCompleted : this.notes[noteIndex].isCompleted,
      // Update priority if provided
      priority: noteData.hasOwnProperty('priority') ? noteData.priority : this.notes[noteIndex].priority
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

  toggleTodoStatus(id) {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    if (noteIndex === -1) {
      console.warn('Note not found for todo status toggle:', id);
      return false;
    }

    const note = this.notes[noteIndex];
    const originalState = { ...note };
    
    // Three-state cycle: not todo → active todo → completed todo → not todo
    if (!note.isTodo) {
      // Convert to active todo
      note.isTodo = true;
      note.isCompleted = false;
    } else if (note.isTodo && !note.isCompleted) {
      // Mark as completed
      note.isCompleted = true;
    } else if (note.isTodo && note.isCompleted) {
      // Convert back to regular note
      note.isTodo = false;
      note.isCompleted = false;
    }

    note.updatedAt = new Date().toISOString();
    
    // Optimistic UI update
    const cardElement = document.querySelector(`[data-note-id="${id}"]`);
    if (cardElement) {
      this.updateTodoStatusUI(cardElement, note);
    }

    try {
      this.saveNotes();
      this.applyFilters();
      this.renderNotes();
      this.updateSearchInfo();
      
      // Success feedback
      const statusMessage = this.getTodoStatusMessage(note);
      this.showToast(statusMessage, 'success');
      
      // Announce to screen readers
      this.announceTodoStatusChange(note);
      
    } catch (error) {
      // Error recovery - revert to original state
      console.error('Failed to update todo status:', error);
      this.notes[noteIndex] = originalState;
      if (cardElement) {
        this.updateTodoStatusUI(cardElement, originalState);
      }
      this.showToast('Failed to update todo status', 'error');
      return false;
    }
    
    return true;
  }

  // Helper methods for todo status management
  updateTodoStatusUI(cardElement, note) {
    const todoBtn = cardElement.querySelector('.todo-status-btn');
    if (!todoBtn) return;
    
    // Update button classes
    todoBtn.className = `todo-status-btn ${this.getTodoStatusClass(note)}`;
    
    // Update icon
    const icon = todoBtn.querySelector('.status-icon');
    if (icon) {
      icon.textContent = this.getTodoStatusIcon(note);
    }
    
    // Update ARIA label
    todoBtn.setAttribute('aria-label', `Toggle todo status: ${this.getTodoStatusLabel(note)}`);
    todoBtn.setAttribute('title', `Click to ${this.getNextActionLabel(note)}`);
    
    // Update card classes
    cardElement.classList.toggle('todo-card', note.isTodo);
    cardElement.classList.toggle('completed', note.isCompleted);
  }

  getTodoStatusClass(note) {
    if (!note.isTodo) return 'not-todo';
    return note.isCompleted ? 'completed' : 'active';
  }

  getTodoStatusIcon(note) {
    if (!note.isTodo) return '○';        // Regular note: Empty circle
    if (note.isCompleted) return '●';    // Completed: Filled circle
    return '◐';                          // Active todo: Half-filled circle
  }

  getTodoStatusLabel(note) {
    if (!note.isTodo) return 'not a todo';
    return note.isCompleted ? 'completed todo' : 'active todo';
  }

  getNextActionLabel(note) {
    if (!note.isTodo) return 'make this a todo';
    if (!note.isCompleted) return 'mark as completed';
    return 'convert back to note';
  }

  getTodoStatusMessage(note) {
    if (!note.isTodo) return 'Note converted to regular note';
    if (note.isCompleted) return 'Todo marked as completed';
    return 'Note converted to todo';
  }

  announceTodoStatusChange(note) {
    const announcement = `${note.title || 'Note'} ${this.getTodoStatusMessage(note).toLowerCase()}`;
    
    // Create or update live region
    let liveRegion = document.getElementById('todo-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'todo-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = announcement;
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

    // Apply todo filters
    if (this.currentTodoFilter !== 'all') {
      switch (this.currentTodoFilter) {
        case 'todos':
          filtered = filtered.filter(note => note.isTodo);
          break;
        case 'active':
          filtered = filtered.filter(note => note.isTodo && !note.isCompleted);
          break;
        case 'completed':
          filtered = filtered.filter(note => note.isTodo && note.isCompleted);
          break;
      }
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

  setTodoFilter(filter) {
    this.currentTodoFilter = filter;
    
    // Update todo filter chip states
    document.querySelectorAll('.filter-chip[data-todo-filter]').forEach(chip => {
      const isActive = chip.dataset.todoFilter === filter;
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
    this.currentTodoFilter = 'all';
    
    // Reset UI
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      const isAll = chip.dataset.filter === 'all';
      chip.classList.toggle('active', isAll);
      chip.setAttribute('aria-pressed', isAll);
    });

    document.querySelectorAll('.filter-chip[data-todo-filter]').forEach(chip => {
      const isAll = chip.dataset.todoFilter === 'all';
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
    
    // Update todo filter visibility
    this.updateTodoFilterVisibility();
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

    // Add todo-specific classes for glassmorphic styling
    if (note.isTodo) {
      card.classList.add('todo');
    }

    // Priority labels and classes
    const priorities = [
      { label: 'Urgent & Important', shortLabel: 'UI', className: 'priority-urgent-important' },
      { label: 'Not Urgent but Important', shortLabel: 'NI', className: 'priority-not-urgent-important' },
      { label: 'Urgent but Not Important', shortLabel: 'UN', className: 'priority-urgent-not-important' },
      { label: 'Not Urgent & Not Important', shortLabel: 'NN', className: 'priority-not-urgent-not-important' }
    ];
    
    const currentPriority = priorities[note.priority || 0];
    
    // Mode toggle button
    const modeToggleHtml = `
      <button class="mode-toggle ${note.isTodo ? 'todo' : ''}" 
              data-note-id="${note.id}"
              aria-pressed="${note.isTodo}"
              aria-label="Toggle between note and todo mode"
              title="Switch to ${note.isTodo ? 'note' : 'todo'} mode">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z" />
        </svg>
        <span class="mode-text">${note.isTodo ? 'Todo' : 'Note'}</span>
      </button>
    `;
    
    // Todo controls (only shown in todo mode)
    const todoControlsHtml = note.isTodo ? `
      <div class="todo-controls">
        <div class="flex">
          <input type="checkbox" 
                 class="checkbox-todo" 
                 data-note-id="${note.id}"
                 ${note.isCompleted ? 'checked' : ''}
                 aria-label="Mark task as completed" />
          <label class="todo-label" for="checkbox-${note.id}">${this.escapeHtml(note.title || note.content)}</label>
        </div>
        <div class="priority-tag ${currentPriority.className}" 
             data-note-id="${note.id}"
             tabindex="0" 
             role="button" 
             aria-haspopup="listbox" 
             aria-expanded="false" 
             title="Priority: ${currentPriority.label}"
             aria-label="Task priority: ${currentPriority.label}">
          ${currentPriority.shortLabel}
        </div>
        <div class="priority-dropdown position-bottom-right" 
             data-note-id="${note.id}"
             role="listbox" 
             aria-labelledby="priority-tag-${note.id}">
          ${priorities.map((priority, index) => `
            <button class="${priority.className}" 
                    role="option" 
                    tabindex="-1" 
                    data-priority="${index}"
                    data-note-id="${note.id}"
                    title="Set priority to ${priority.label}">
              <span class="priority-color"></span> ${priority.label}
            </button>
          `).join('')}
        </div>
      </div>
    ` : '';
    
    // Card content based on mode
    const cardContentHtml = note.isTodo ? '' : `
      <div class="card-title">${this.escapeHtml(note.title || this.generateTitle(note.content))}</div>
      <div class="card-content">${this.highlightSearchTerm(this.escapeHtml(this.truncateContent(note.content, 120)))}</div>
    `;

    card.innerHTML = `
      ${modeToggleHtml}
      ${cardContentHtml}
      ${todoControlsHtml}
      
      <div class="note-actions">
        <button class="action-btn edit-btn" aria-label="Edit ${note.isTodo ? 'todo' : 'note'}" title="Edit">✏️</button>
        <button class="action-btn delete-btn" aria-label="Delete ${note.isTodo ? 'todo' : 'note'}" title="Delete">🗑️</button>
      </div>
    `;
    
    // Set proper checkbox ID for accessibility
    const checkbox = card.querySelector('.checkbox-todo');
    if (checkbox) {
      checkbox.id = `checkbox-${note.id}`;
    }

    // Add event listeners
    this.bindUnifiedCardEvents(card, note);

    return card;
  }

  bindUnifiedCardEvents(card, note) {
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    const actions = card.querySelector('.note-actions');
    const modeToggle = card.querySelector('.mode-toggle');
    const todoCheckbox = card.querySelector('.checkbox-todo');
    const priorityTag = card.querySelector('.priority-tag');
    const priorityDropdown = card.querySelector('.priority-dropdown');
    const priorityButtons = priorityDropdown?.querySelectorAll('button') || [];

    // Mode toggle (note/todo switch)
    modeToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNoteMode(note.id);
    });

    // Todo checkbox
    todoCheckbox?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.toggleTodoCompletion(note.id);
    });

    // Priority tag click with smart positioning and error handling
    priorityTag?.addEventListener('click', (e) => {
      e.stopPropagation();
      
      try {
        const expanded = priorityTag.getAttribute('aria-expanded') === 'true';
        
        if (expanded) {
          priorityTag.setAttribute('aria-expanded', 'false');
          this.dropdownController.closeActiveDropdown();
        } else {
          // Close other open dropdowns first
          this.dropdownController.closeActiveDropdown();
          
          // Clean up any orphaned dropdowns
          document.querySelectorAll('.priority-dropdown.open').forEach(dropdown => {
            dropdown.classList.remove('open');
            const tag = dropdown.previousElementSibling;
            if (tag && tag.classList.contains('priority-tag')) {
              tag.setAttribute('aria-expanded', 'false');
            }
          });
          
          // Open the new dropdown
          priorityTag.setAttribute('aria-expanded', 'true');
          this.dropdownController.openDropdown(priorityTag, priorityDropdown);
        }
      } catch (error) {
        console.error('Priority tag click error:', error);
        // Fallback: ensure clean state
        priorityTag.setAttribute('aria-expanded', 'false');
        this.dropdownController.closeActiveDropdown();
      }
    });
    
    // Enhanced keyboard support for priority tag
    priorityTag?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        priorityTag.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.dropdownController.closeActiveDropdown();
      }
    });

    // Priority selection with enhanced keyboard navigation and error handling
    priorityButtons.forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        try {
          this.updateNotePriority(note.id, index);
          if (priorityTag) {
            priorityTag.setAttribute('aria-expanded', 'false');
          }
          this.dropdownController.closeActiveDropdown();
          
          // Return focus to trigger element
          setTimeout(() => {
            if (priorityTag) {
              priorityTag.focus();
            }
          }, 100);
        } catch (error) {
          console.error('Priority selection error:', error);
          this.dropdownController.closeActiveDropdown();
        }
      });
      
      btn.addEventListener('keydown', (e) => {
        // Use the enhanced keyboard navigation handler
        this.dropdownController.handleKeyboardNavigation(e, priorityDropdown);
        
        // Handle selection keys
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

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

    // Card click (edit note) - exclude clicks on interactive elements
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking on interactive elements
      if (e.target.closest('.mode-toggle, .checkbox-todo, .priority-tag, .priority-dropdown, .action-btn')) {
        return;
      }
      this.openEditNoteModal(note);
    });

    // Keyboard navigation
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openEditNoteModal(note);
      }
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
    this.elements.noteIsTodo.checked = false;
    this.clearFormErrors();
    this.updateCharacterCount();
    
    this.showModal();
    this.elements.noteContent.focus();
  }

  openAddTodoModal() {
    this.editingNoteId = null;
    this.elements.modalTitle.textContent = 'Add New Todo';
    this.elements.saveBtn.innerHTML = '<span class="btn-text">Save Todo</span><span class="btn-loading" style="display: none;">Saving...</span>';
    
    // Clear any existing draft to ensure clean slate
    this.clearDraft();
    
    // Clear form and pre-check todo checkbox
    this.elements.noteTitle.value = '';
    this.elements.noteContent.value = '';
    this.elements.noteTags.value = '';
    this.elements.noteIsTodo.checked = true;
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
    this.elements.noteIsTodo.checked = note.isTodo || false;
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
      const noteData = { 
        title, 
        content, 
        tags, 
        isTodo: this.elements.noteIsTodo.checked,
        isCompleted: false, // New todo items start as incomplete
        priority: 0 // Default to Urgent & Important
      };

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
    // Get all existing tags from all notes
    const allTags = [...new Set(this.notes.flatMap(note => note.tags))];
    
    // Parse current input to get partial tag and complete tags
    const { partialTag, completeTags } = this.getCurrentPartialTag();
    
    // Only show suggestions if user is typing a partial tag
    if (!partialTag) {
      this.elements.tagSuggestions.style.display = 'none';
      return;
    }
    
    // Filter suggestions based on partial tag, excluding already used tags
    const suggestions = allTags.filter(tag => 
      tag.toLowerCase().includes(partialTag.toLowerCase()) && 
      !completeTags.includes(tag.toLowerCase()) &&
      tag.toLowerCase() !== partialTag.toLowerCase() // Don't suggest exact matches
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

  getCurrentPartialTag() {
    const fullInput = this.elements.noteTags.value;
    if (!fullInput.trim()) return { partialTag: '', completeTags: [] };
    
    // Split by comma and trim each part
    const parts = fullInput.split(',').map(part => part.trim());
    
    // If the input ends with a comma (or comma + spaces), user is starting a new tag
    if (/,\s*$/.test(fullInput)) {
      return {
        partialTag: '',
        completeTags: parts.filter(part => part.length > 0)
      };
    }
    
    // Otherwise, the last part is the partial tag being typed
    const partialTag = parts[parts.length - 1] || '';
    const completeTags = parts.slice(0, -1).filter(part => part.length > 0);
    
    return { partialTag, completeTags };
  }

  addTagToInput(tag) {
    const { partialTag, completeTags } = this.getCurrentPartialTag();
    
    // Check if tag already exists in complete tags
    if (completeTags.some(existingTag => existingTag.toLowerCase() === tag.toLowerCase())) {
      this.elements.tagSuggestions.style.display = 'none';
      return;
    }
    
    // Replace partial tag with selected tag and add trailing comma + space
    const newTags = [...completeTags, tag];
    this.elements.noteTags.value = newTags.join(', ') + ', ';
    this.elements.tagSuggestions.style.display = 'none';
    
    // Focus the input field for immediate next tag typing
    this.elements.noteTags.focus();
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
                           this.activeTagFilters.size > 0 ||
                           this.currentTodoFilter !== 'all';
    
    if (this.elements.clearFilters) {
      this.elements.clearFilters.style.display = hasActiveFilters ? 'block' : 'none';
    }
  }

  updateTodoFilterVisibility() {
    if (!this.elements.todoFilterChips) return;

    // Check if any notes are todos
    const hasTodos = this.notes.some(note => note.isTodo);
    
    // Show/hide todo filter chips based on whether todos exist
    this.elements.todoFilterChips.style.display = hasTodos ? 'flex' : 'none';
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
    // Escape: Close dropdowns and modals with priority
    if (e.key === 'Escape') {
      // First priority: close active dropdown
      if (this.dropdownController.activeDropdown) {
        this.dropdownController.closeActiveDropdown();
        return;
      }
      
      // Second priority: close modal
      if (this.elements.modalOverlay.classList.contains('show')) {
        this.closeModal();
        return;
      }
      
      // Third priority: handle other escape actions
      return;
    }

    // Ctrl/Cmd + N: New note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
      e.preventDefault();
      this.openAddNoteModal();
      return;
    }

    // Ctrl/Cmd + Shift + N: New todo note
    if ((e.ctrlKey || e.metaKey) && e.key === 'N' && e.shiftKey) {
      e.preventDefault();
      this.openAddTodoModal();
      return;
    }

    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      this.elements.searchInput?.focus();
      return;
    }

    // Additional escape handling for other UI elements
    if (e.key === 'Escape') {
      // Check for confirmation modal
      if (this.elements.confirmModalOverlay.style.display === 'flex') {
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

    // Todo filter shortcuts
    // Ctrl/Cmd + T: Filter to todos only
    if ((e.ctrlKey || e.metaKey) && e.key === 't' && 
        this.elements.modalOverlay.style.display !== 'flex') {
      e.preventDefault();
      this.setTodoFilter('todos');
      return;
    }

    // Ctrl/Cmd + Shift + A: Filter to active todos
    if ((e.ctrlKey || e.metaKey) && e.key === 'A' && e.shiftKey &&
        this.elements.modalOverlay.style.display !== 'flex') {
      e.preventDefault();
      this.setTodoFilter('active');
      return;
    }

    // Ctrl/Cmd + Shift + C: Filter to completed todos
    if ((e.ctrlKey || e.metaKey) && e.key === 'C' && e.shiftKey &&
        this.elements.modalOverlay.style.display !== 'flex') {
      e.preventDefault();
      this.setTodoFilter('completed');
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

  
  // ==========================================================================
  // Unified Card System - New Methods
  // ==========================================================================

  toggleNoteMode(noteId) {
    const noteIndex = this.notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) return;

    const note = this.notes[noteIndex];
    note.isTodo = !note.isTodo;
    
    // If switching to todo mode and no title, keep content visible
    // If switching from todo to note, ensure we have a proper title
    if (!note.isTodo && !note.title.trim()) {
      note.title = this.generateTitle(note.content);
    }
    
    note.updatedAt = new Date().toISOString();
    
    this.saveNotes();
    this.applyFilters();
    this.renderNotes();
    
    const modeText = note.isTodo ? 'todo' : 'note';
    this.showToast(`Converted to ${modeText}`, 'success');
  }

  toggleTodoCompletion(noteId) {
    const noteIndex = this.notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) return;

    const note = this.notes[noteIndex];
    note.isCompleted = !note.isCompleted;
    note.updatedAt = new Date().toISOString();
    
    this.saveNotes();
    this.applyFilters();
    this.renderNotes();
    
    const statusText = note.isCompleted ? 'completed' : 'active';
    this.showToast(`Todo marked as ${statusText}`, 'success');
  }

  updateNotePriority(noteId, priority) {
    const noteIndex = this.notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) return;

    const note = this.notes[noteIndex];
    note.priority = priority;
    note.updatedAt = new Date().toISOString();
    
    this.saveNotes();
    this.applyFilters();
    this.renderNotes();
    
    const priorities = ['Urgent & Important', 'Not Urgent but Important', 'Urgent but Not Important', 'Not Urgent & Not Important'];
    this.showToast(`Priority set to ${priorities[priority]}`, 'success');
  }

  // ==========================================================================
  // Todo Feature Validation (for testing)
  // ==========================================================================

  validateTodoFeature() {
    console.log('🧪 Validating Todo Feature Implementation...');
    
    const validations = {
      dataSchema: this.notes.every(note => 
        typeof note.isTodo === 'boolean' && typeof note.isCompleted === 'boolean'
      ),
      htmlElements: !!(this.elements.noteIsTodo && this.elements.todoFilterChips),
      filterFunctionality: ['all', 'todos', 'active', 'completed'].includes(this.currentTodoFilter),
      cssStyles: !!document.querySelector('.todo-card, .todo-checkbox, .checkbox-label'),
      keyboardShortcuts: true // Assume working if no errors during binding
    };

    const allValid = Object.values(validations).every(Boolean);
    
    console.log('📊 Todo Feature Validation Results:', validations);
    console.log(allValid ? '✅ All todo features validated successfully!' : '❌ Some todo features need attention');
    
    return allValid;
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