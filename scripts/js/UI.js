

export class UI {
    constructor() {
        this.elements = this.cacheElements();
    }

    cacheElements() {
        return {
            searchInput: document.querySelector('.js-search-input'),
            searchClear: document.querySelector('.js-search-clear'),
            filterToggle: document.querySelector('.js-filter-toggle'),
            filterPanel: document.querySelector('.js-filter-panel'),
            activeFilters: document.querySelector('.js-active-filters'),
            timeFilters: document.querySelectorAll('.js-time-filter'),
            tagFilters: document.querySelectorAll('.js-tag-filter'),
            notesGrid: document.querySelector('.js-notes-grid'),
            emptyState: document.querySelector('.js-empty-state'),
            loadingSkeleton: document.querySelector('.js-loading-skeleton'),
            searchResults: document.querySelector('.js-search-results'),
            noteCount: document.querySelector('.js-note-count'),
            modalOverlay: document.querySelector('.js-modal-overlay'),
            addNoteModal: document.querySelector('.js-add-note-modal'),
            modalClose: document.querySelectorAll('.js-modal-close'),
            noteForm: document.querySelector('.js-note-form'),
            noteTitle: document.querySelector('.js-note-title'),
            noteContent: document.querySelector('.js-note-content'),
            noteTags: document.querySelector('.js-note-tags'),
            tagSuggestions: document.querySelectorAll('.tag-suggestion'),
            saveBtn: document.querySelector('.js-save-note'),
            themeToggle: document.querySelector('.js-theme-toggle'),
            exportBtn: document.querySelector('.js-export-btn'),
            importInput: document.getElementById('import-file-input'),
            navItems: document.querySelectorAll('.nav-item'),
            announcements: document.getElementById('screen-reader-announcements'),
            addNoteCard: document.querySelector('.js-add-note-trigger')
        };
    }

    renderNotes(notes, searchQuery) {
        const notesGrid = this.elements.notesGrid;
        const addNoteCard = notesGrid.querySelector('.add-note-card');

        notesGrid.innerHTML = '';
        if (addNoteCard) {
            notesGrid.appendChild(addNoteCard);
        }

        if (notes.length === 0) {
            this.elements.emptyState.classList.add('visible');
        } else {
            this.elements.emptyState.classList.remove('visible');
            notes.forEach((note, index) => {
                const noteCard = this.createNoteCard(note, index, searchQuery);
                notesGrid.appendChild(noteCard);
            });
        }
        notesGrid.classList.add('visible');
    }

    createNoteCard(note, index, searchQuery) {
        const card = document.createElement('article');
        card.className = 'note-card';
        card.setAttribute('aria-label', `Note from ${this.formatDate(note.createdAt)}`);
        card.style.animationDelay = `${index * 50}ms`;

        if (note.tags && note.tags.includes('mcp-tool')) {
            card.classList.add('mcp-tool');
        }

        const timeAgo = this.getTimeAgo(note.createdAt);
        const tags = note.tags || [];

        card.innerHTML = `
            <header class="note-header">
                <div class="note-tags" aria-label="Tags: ${tags.join(', ')}">
                    ${tags.map(tag => `<span class="note-tag ${tag}">${tag}</span>`).join('')}
                </div>
                <div class="note-meta">
                    <time class="note-time" datetime="${note.createdAt}" title="${this.formatDate(note.createdAt)}">
                        ${timeAgo}
                    </time>
                    <div class="note-actions">
                        <button class="action-btn edit-note" aria-label="Edit note" title="Edit note" data-id="${note.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m18 2 4 4-14 14H4v-4L18 2z"/>
                                <path d="M14.5 5.5 18.5 9.5"/>
                            </svg>
                        </button>
                        <button class="action-btn delete-note" aria-label="Delete note" title="Delete note" data-id="${note.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>
            <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
            <div class="note-content">${this.formatNoteContent(note.content, searchQuery)}</div>
        `;

        return card;
    }

    updateNoteCount(count) {
        this.elements.noteCount.textContent = count;
    }

    showLoadingState() {
        this.elements.loadingSkeleton.style.display = 'flex';
        this.elements.notesGrid.classList.remove('visible');
        this.elements.emptyState.classList.remove('visible');
    }

    hideLoadingState() {
        this.elements.loadingSkeleton.style.display = 'none';
    }

    openModal() {
        this.elements.modalOverlay.classList.add('active');
        this.elements.addNoteCard.setAttribute('data-state', 'active');
        setTimeout(() => this.elements.noteContent.focus(), 300);
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.elements.modalOverlay.classList.remove('active');
        this.elements.addNoteCard.setAttribute('data-state', 'default');
        this.clearForm();
        document.body.style.overflow = '';
        this.elements.addNoteCard.focus();
    }

    clearForm() {
        this.elements.noteTitle.value = '';
        this.elements.noteContent.value = '';
        this.elements.noteTags.value = '';
    }
    
    formatNoteContent(content, searchQuery) {
        let formatted = this.escapeHtml(content);
        if (searchQuery) {
            const regex = new RegExp(`(${this.escapeRegex(searchQuery)})`, 'gi');
            formatted = formatted.replace(regex, '<span class="highlight">$1</span>');
        }
        formatted = formatted.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
        return formatted || '<p><em>Empty note</em></p>';
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return this.formatDate(dateString);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\]/g, '\\$&');
    }

    announce(message) {
        if (this.elements.announcements) {
            this.elements.announcements.textContent = message;
            setTimeout(() => {
                this.elements.announcements.textContent = '';
            }, 1000);
        }
    }

    updateSearchResults(count, searchQuery, activeFilters) {
        const searchResults = this.elements.searchResults;
        const hasActiveFilters = searchQuery || activeFilters.time !== 'all' || activeFilters.tags.length > 0;
        
        if (hasActiveFilters) {
            let resultsText = `${count} note${count !== 1 ? 's' : ''}`;
            
            if (searchQuery) {
                resultsText += ` matching "${searchQuery}"`;
            }
            
            if (activeFilters.time !== 'all') {
                resultsText += ` from ${activeFilters.time}`;
            }
            
            if (activeFilters.tags.length > 0) {
                resultsText += ` tagged with ${activeFilters.tags.join(', ')}`;
            }
            
            searchResults.textContent = resultsText;
            searchResults.classList.add('visible');
        } else {
            searchResults.classList.remove('visible');
        }
    }

    updateThemeToggle(currentTheme) {
        const isDarkMode = currentTheme === 'dark';
        const label = isDarkMode ? 'Toggle light mode' : 'Toggle dark mode';
        const icon = this.elements.themeToggle.querySelector('.theme-icon');
        
        this.elements.themeToggle.setAttribute('aria-label', label);
        this.elements.themeToggle.setAttribute('title', label);
        
        if (icon) {
            icon.textContent = isDarkMode ? '☀️' : '🌙';
        }
    }
}