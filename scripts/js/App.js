

import { Store } from './Store.js';
import { UI } from './UI.js';

class VibeCodingNotes {
    constructor() {
        this.store = new Store();
        this.ui = new UI();
        this.searchQuery = '';
        this.activeFilters = { time: 'all', tags: [] };
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.ui.showLoadingState();
        this.initializeTheme();
        this.bindEvents();
        this.renderApp();
        setTimeout(() => this.ui.hideLoadingState(), 800);
    }

    initializeTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
        this.ui.updateThemeToggle(this.currentTheme);
    }

    bindEvents() {
        this.ui.elements.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        this.ui.elements.searchClear.addEventListener('click', this.clearSearch.bind(this));
        this.ui.elements.filterToggle.addEventListener('click', this.toggleFilterPanel.bind(this));
        this.ui.elements.timeFilters.forEach(f => f.addEventListener('click', this.handleTimeFilter.bind(this)));
        this.ui.elements.tagFilters.forEach(f => f.addEventListener('click', this.handleTagFilter.bind(this)));
        this.ui.elements.exportBtn.addEventListener('click', this.exportNotes.bind(this));
        this.ui.elements.tagSuggestions.forEach(btn => btn.addEventListener('click', this.handleTagSuggestion.bind(this)));
        this.ui.elements.navItems.forEach(item => item.addEventListener('click', this.handleNavigation.bind(this)));
        this.ui.elements.importInput.addEventListener('change', this.handleImport.bind(this));
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('.js-add-note-trigger')) this.ui.openModal();
            if (e.target.closest('.delete-note')) this.deleteNote(e.target.closest('.delete-note').dataset.id);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        this.ui.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.ui.elements.modalOverlay) this.ui.closeModal();
        });
        this.ui.elements.modalClose.forEach(btn => btn.addEventListener('click', this.ui.closeModal.bind(this.ui)));
        this.ui.elements.noteForm.addEventListener('submit', this.handleNoteSubmit.bind(this));
        this.ui.elements.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    }

    renderApp() {
        this.store.applyFilters(this.searchQuery, this.activeFilters);
        this.ui.renderNotes(this.store.filteredNotes, this.searchQuery);
        this.ui.updateNoteCount(this.store.notes.length);
        this.ui.updateSearchResults(this.store.filteredNotes.length, this.searchQuery, this.activeFilters);
    }

    handleSearch(event) {
        this.searchQuery = event.target.value.toLowerCase().trim();
        this.renderApp();
    }

    clearSearch() {
        this.ui.elements.searchInput.value = '';
        this.searchQuery = '';
        this.renderApp();
        this.ui.elements.searchInput.focus();
    }

    toggleFilterPanel() {
        this.ui.elements.filterPanel.classList.toggle('active');
    }

    handleTimeFilter(event) {
        const filter = event.target.dataset.filter;
        this.activeFilters.time = filter;
        this.ui.elements.timeFilters.forEach(f => f.classList.remove('active'));
        event.target.classList.add('active');
        this.renderApp();
    }

    handleTagFilter(event) {
        const tag = event.target.dataset.tag;
        const isActive = event.target.classList.contains('active');
        if (isActive) {
            this.activeFilters.tags = this.activeFilters.tags.filter(t => t !== tag);
        } else {
            this.activeFilters.tags.push(tag);
        }
        event.target.classList.toggle('active');
        this.renderApp();
    }

    handleNoteSubmit(event) {
        event.preventDefault();
        const title = this.ui.elements.noteTitle.value.trim();
        const content = this.ui.elements.noteContent.value.trim();
        const tagsInput = this.ui.elements.noteTags.value.trim();
        if (!content) {
            this.ui.announce('Please enter note content');
            this.ui.elements.noteContent.focus();
            return;
        }
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : [];
        const note = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            title: title || content.split('\n')[0].substring(0, 50),
            content: content,
            tags: tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.store.addNote(note);
        this.renderApp();
        this.ui.closeModal();
        this.ui.announce('Note saved successfully');
    }

    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            this.store.deleteNote(noteId);
            this.renderApp();
            this.ui.announce('Note deleted');
        }
    }

    exportNotes() {
        try {
            const count = this.store.exportNotes();
            this.ui.announce(`Exported ${count} notes successfully`);
        } catch (error) {
            console.error('Export failed:', error);
            this.ui.announce('Export failed. Please try again.');
        }
    }

    triggerImport() {
        this.ui.elements.importInput.click();
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = this.store.importNotes(e.target.result);
                this.renderApp();
                this.ui.announce(`Imported ${result.imported} notes. ${result.skipped} duplicates skipped.`);
            } catch (error) {
                console.error('Import failed:', error);
                this.ui.announce('Import failed. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Reset the input so the same file can be selected again
        event.target.value = '';
    }

    handleTagSuggestion(event) {
        const tag = event.target.dataset.tag;
        if (tag) {
            const currentTags = this.ui.elements.noteTags.value.trim();
            const tagArray = currentTags ? currentTags.split(',').map(t => t.trim()) : [];
            
            if (!tagArray.includes(tag)) {
                tagArray.push(tag);
                this.ui.elements.noteTags.value = tagArray.join(', ');
            }
            
            this.ui.elements.noteTags.focus();
        }
    }

    handleNavigation(event) {
        const navItem = event.currentTarget;
        const isNotes = navItem.classList.contains('js-nav-notes');
        const isSearch = navItem.classList.contains('js-nav-search');
        const isStats = navItem.classList.contains('js-nav-stats');
        const isSettings = navItem.classList.contains('js-nav-settings');
        
        // Update active state
        this.ui.elements.navItems.forEach(item => item.classList.remove('active'));
        navItem.classList.add('active');
        
        if (isNotes) {
            // Show notes view (default)
            this.clearSearch();
            this.ui.announce('Viewing all notes');
        } else if (isSearch) {
            // Focus search
            this.ui.elements.searchInput.focus();
            this.ui.announce('Search notes');
        } else if (isStats) {
            // Show basic stats
            const totalNotes = this.store.notes.length;
            const tagsCount = new Set(this.store.notes.flatMap(note => note.tags || [])).size;
            this.ui.announce(`${totalNotes} notes with ${tagsCount} unique tags`);
        } else if (isSettings) {
            // Show a simple settings menu
            const action = confirm('Settings:\n\nOK = Toggle Theme\nCancel = Import Notes');
            if (action) {
                this.toggleTheme();
            } else {
                this.triggerImport();
            }
        }
    }

    handleKeyboardShortcuts(event) {
        // Check if user is typing in an input field
        const isInputActive = event.target.tagName === 'INPUT' || 
                             event.target.tagName === 'TEXTAREA' || 
                             event.target.contentEditable === 'true';
        
        // Ctrl/Cmd + N: New note
        if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !isInputActive) {
            event.preventDefault();
            this.ui.openModal();
        }
        
        // Ctrl/Cmd + F: Focus search
        if ((event.ctrlKey || event.metaKey) && event.key === 'f' && !isInputActive) {
            event.preventDefault();
            this.ui.elements.searchInput.focus();
        }
        
        // Ctrl/Cmd + E: Export notes
        if ((event.ctrlKey || event.metaKey) && event.key === 'e' && !isInputActive) {
            event.preventDefault();
            this.exportNotes();
        }
        
        // Escape: Close modal or clear search
        if (event.key === 'Escape') {
            if (this.ui.elements.modalOverlay.classList.contains('active')) {
                this.ui.closeModal();
            } else if (this.searchQuery) {
                this.clearSearch();
            }
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.ui.updateThemeToggle(this.currentTheme);
        this.ui.announce(`Switched to ${this.currentTheme} theme`);
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

document.addEventListener('DOMContentLoaded', () => {
    window.vibeCodingNotes = new VibeCodingNotes();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
});
