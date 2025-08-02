
export class Store {
    constructor() {
        this.notes = [];
        this.filteredNotes = [];
        this.loadNotes();
    }

    loadNotes() {
        try {
            const savedNotes = localStorage.getItem('vibeCodingNotes');
            this.notes = savedNotes ? JSON.parse(savedNotes) : [];
            this.filteredNotes = [...this.notes];
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
            this.filteredNotes = [];
        }
    }

    saveNotes() {
        try {
            localStorage.setItem('vibeCodingNotes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    addNote(note) {
        this.notes.unshift(note);
        this.saveNotes();
    }

    deleteNote(noteId) {
        this.notes = this.notes.filter(note => note.id !== noteId);
        this.saveNotes();
    }

    applyFilters(searchQuery, activeFilters) {
        let filtered = [...this.notes];

        if (searchQuery) {
            filtered = filtered.filter(note => {
                const searchableContent = [
                    note.title || '',
                    note.content || '',
                    ...(note.tags || [])
                ].join(' ').toLowerCase();
                return searchableContent.includes(searchQuery);
            });
        }

        if (activeFilters.time !== 'all') {
            const now = new Date();
            const filterDate = this.getFilterDate(activeFilters.time, now);
            filtered = filtered.filter(note => new Date(note.createdAt) >= filterDate);
        }

        if (activeFilters.tags.length > 0) {
            filtered = filtered.filter(note => {
                return activeFilters.tags.some(tag =>
                    note.tags && note.tags.includes(tag)
                );
            });
        }

        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        this.filteredNotes = filtered;
    }

    getFilterDate(filter, now) {
        switch (filter) {
            case 'today':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return weekAgo;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                return monthAgo;
            default:
                return new Date(0);
        }
    }

    exportNotes() {
        const exportData = {
            notes: this.notes,
            exportedAt: new Date().toISOString(),
            version: '1.0',
            totalNotes: this.notes.length
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `vibe-coding-notes-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return exportData.totalNotes;
    }

    importNotes(jsonData) {
        try {
            const importData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!importData.notes || !Array.isArray(importData.notes)) {
                throw new Error('Invalid import data format');
            }

            // Validate note structure
            const validNotes = importData.notes.filter(note => 
                note.id && note.content && note.createdAt
            );

            // Merge with existing notes, avoiding duplicates
            const existingIds = new Set(this.notes.map(note => note.id));
            const newNotes = validNotes.filter(note => !existingIds.has(note.id));
            
            this.notes = [...this.notes, ...newNotes];
            this.notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            this.saveNotes();
            
            return {
                imported: newNotes.length,
                skipped: validNotes.length - newNotes.length,
                total: validNotes.length
            };
        } catch (error) {
            console.error('Error importing notes:', error);
            throw error;
        }
    }
}
