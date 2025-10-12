class NotesApp {
    constructor() {
        this.notes = [];
        this.stacks = [];
        this.noteInput = document.getElementById('noteInput');
        this.notesCanvas = document.getElementById('notesCanvas');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.noteCountElement = document.querySelector('.note-count');
        this.timeStatsElement = document.getElementById('timeStats');
        this.stackModal = document.getElementById('stackModal');
        this.stackModalBody = document.getElementById('stackModalBody');
        this.stackModalClose = document.getElementById('stackModalClose');
        this.draggedCard = null;
        this.currentStackId = null;

        this.init();
    }

    init() {
        // Load notes from localStorage
        this.loadNotes();

        // Event listeners
        this.noteInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Modal event listeners
        this.stackModalClose.addEventListener('click', () => this.closeStackModal());
        this.stackModal.querySelector('.stack-modal-overlay').addEventListener('click', () => this.closeStackModal());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.stackModal.style.display !== 'none') {
                this.closeStackModal();
            }
        });

        // Initial render
        this.render();
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.addNote();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.noteInput.value = '';
        }
    }

    addNote() {
        let content = this.noteInput.value.trim();

        if (content === '') return;

        // Check for category tags FIRST (e.g., --k, --h, --p)
        let category = null;
        const categoryMatch = content.match(/--([khp])$/);
        if (categoryMatch) {
            category = categoryMatch[1];
            content = content.replace(/\s*--[khp]$/, '').trim();
        }

        // Then check for time estimate (e.g., 15m, 30m, 125m)
        let timeMinutes = null;
        const timeMatch = content.match(/\s+(\d+)m$/);
        if (timeMatch) {
            timeMinutes = parseInt(timeMatch[1]);
            content = content.replace(/\s+\d+m$/, '').trim();
        }

        const note = {
            id: Date.now(),
            content: content,
            timestamp: new Date().toISOString(),
            completed: false,
            stackId: null,
            category: category,
            timeMinutes: timeMinutes,
        };

        this.notes.unshift(note); // Add to beginning of array
        this.saveNotes();
        this.noteInput.value = '';
        this.render();
    }

    deleteNote(id, skipAnimation = false) {
        if (skipAnimation) {
            this.notes = this.notes.filter(note => note.id !== id);

            // Also remove from stacks
            this.stacks.forEach(stack => {
                stack.noteIds = stack.noteIds.filter(noteId => noteId !== id);
            });

            // Remove empty stacks
            this.stacks = this.stacks.filter(stack => stack.noteIds.length > 0);

            this.saveNotes();
            this.saveStacks();
            this.render();
        } else {
            // Find the card element and animate it
            const cardElement = document.querySelector(`[data-note-id="${id}"]`);
            if (cardElement) {
                cardElement.classList.add('removing');
                setTimeout(() => {
                    this.deleteNote(id, true);
                }, 300);
            }
        }
    }

    toggleComplete(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            // Find the card element and animate it
            const cardElement = document.querySelector(`[data-note-id="${id}"]`);
            if (cardElement) {
                cardElement.classList.add('removing');
                setTimeout(() => {
                    this.notes = this.notes.filter(n => n.id !== id);

                    // Also remove from stacks
                    this.stacks.forEach(stack => {
                        stack.noteIds = stack.noteIds.filter(noteId => noteId !== id);
                    });

                    // Remove empty stacks
                    this.stacks = this.stacks.filter(stack => stack.noteIds.length > 0);

                    this.saveNotes();
                    this.saveStacks();
                    this.render();
                }, 300);
            }
        }
    }

    enterEditMode(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        const cardElement = document.querySelector(`[data-note-id="${id}"]`);
        if (!cardElement) return;

        const contentElement = cardElement.querySelector('.note-content');
        if (!contentElement) return;

        // Store original content in case of cancel
        note._originalContent = note.content;
        note._originalCategory = note.category;
        note._originalTime = note.timeMinutes;

        // Build full edit string with category and time tags
        let editText = note.content;
        if (note.timeMinutes) {
            editText += ` ${note.timeMinutes}m`;
        }
        if (note.category) {
            editText += ` --${note.category}`;
        }

        // Make content editable
        contentElement.contentEditable = true;
        contentElement.textContent = editText;
        cardElement.classList.add('editing');
        cardElement.draggable = false; // Disable dragging while editing

        // Add hint
        const existingHint = cardElement.querySelector('.edit-hint');
        if (!existingHint) {
            const hint = document.createElement('div');
            hint.className = 'edit-hint';
            hint.textContent = 'Enter zum Speichern • ESC zum Abbrechen';
            cardElement.appendChild(hint);
        }

        // Focus and select text
        contentElement.focus();
        const range = document.createRange();
        range.selectNodeContents(contentElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Add keyboard event listeners
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveEdit(id);
                contentElement.removeEventListener('keydown', handleKeyDown);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEdit(id);
                contentElement.removeEventListener('keydown', handleKeyDown);
            }
        };

        contentElement.addEventListener('keydown', handleKeyDown);

        // Store handler for cleanup
        contentElement._editKeyHandler = handleKeyDown;
    }

    cancelEdit(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        // Restore original content
        if (note._originalContent !== undefined) {
            note.content = note._originalContent;
            note.category = note._originalCategory;
            note.timeMinutes = note._originalTime;

            delete note._originalContent;
            delete note._originalCategory;
            delete note._originalTime;
        }

        this.render();
    }

    saveEdit(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        const cardElement = document.querySelector(`[data-note-id="${id}"]`);
        if (!cardElement) return;

        const contentElement = cardElement.querySelector('.note-content');
        if (!contentElement) return;

        let content = contentElement.textContent.trim();

        if (content === '') {
            // If empty, restore original or delete
            this.cancelEdit(id);
            return;
        }

        // Parse content using same logic as addNote
        // Check for category tags FIRST (e.g., --k, --h, --p)
        let category = null;
        const categoryMatch = content.match(/--([khp])$/);
        if (categoryMatch) {
            category = categoryMatch[1];
            content = content.replace(/\s*--[khp]$/, '').trim();
        }

        // Then check for time estimate (e.g., 15m, 30m, 125m)
        let timeMinutes = null;
        const timeMatch = content.match(/\s+(\d+)m$/);
        if (timeMatch) {
            timeMinutes = parseInt(timeMatch[1]);
            content = content.replace(/\s+\d+m$/, '').trim();
        }

        // Update note
        note.content = content;
        note.category = category;
        note.timeMinutes = timeMinutes;

        // Clean up temporary properties
        delete note._originalContent;
        delete note._originalCategory;
        delete note._originalTime;

        this.saveNotes();
        this.render();
    }

    openStackModal(stackId) {
        this.currentStackId = stackId;
        const stack = this.stacks.find(s => s.id === stackId);
        if (!stack) return;

        // Get notes in stack
        const stackNotes = stack.noteIds
            .map(id => this.notes.find(n => n.id === id))
            .filter(n => n);

        // Clear modal body
        this.stackModalBody.innerHTML = '';

        // Create cards for modal
        stackNotes.forEach((note, index) => {
            const isFirst = index === 0;
            const isLast = index === stackNotes.length - 1;
            const card = this.createModalCard(note, isFirst, isLast);
            this.stackModalBody.appendChild(card);
        });

        // Show modal
        this.stackModal.style.display = 'flex';
    }

    closeStackModal() {
        this.stackModal.style.display = 'none';
        this.currentStackId = null;
        this.render(); // Re-render to update stack display
    }

    saveNotes() {
        localStorage.setItem('simpleNotes', JSON.stringify(this.notes));
    }

    loadNotes() {
        const saved = localStorage.getItem('simpleNotes');
        if (saved) {
            this.notes = JSON.parse(saved);
        }

        const savedStacks = localStorage.getItem('simpleStacks');
        if (savedStacks) {
            this.stacks = JSON.parse(savedStacks);
        }
    }

    saveStacks() {
        localStorage.setItem('simpleStacks', JSON.stringify(this.stacks));
    }

    createStack(noteIds) {
        const stackId = Date.now();
        const stack = {
            id: stackId,
            noteIds: noteIds,
        };
        this.stacks.push(stack);

        // Update notes with stackId
        noteIds.forEach(id => {
            const note = this.notes.find(n => n.id === id);
            if (note) {
                note.stackId = stackId;
            }
        });

        this.saveNotes();
        this.saveStacks();
    }

    addToStack(stackId, noteId) {
        const stack = this.stacks.find(s => s.id === stackId);
        if (stack && !stack.noteIds.includes(noteId)) {
            stack.noteIds.push(noteId);

            const note = this.notes.find(n => n.id === noteId);
            if (note) {
                note.stackId = stackId;
            }

            this.saveNotes();
            this.saveStacks();
        }
    }

    handleDragStart(e, noteId) {
        this.draggedCard = noteId;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedCard = null;

        // Remove all drag-over classes
        document.querySelectorAll('.note-card').forEach(card => {
            card.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDragEnter(e, noteId) {
        if (this.draggedCard !== noteId) {
            e.target.closest('.note-card').classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        e.target.closest('.note-card').classList.remove('drag-over');
    }

    handleDrop(e, targetNoteId) {
        e.stopPropagation();
        e.preventDefault();

        const targetCard = e.target.closest('.note-card');
        targetCard.classList.remove('drag-over');

        if (this.draggedCard === targetNoteId) return;

        const draggedNote = this.notes.find(n => n.id === this.draggedCard);
        const targetNote = this.notes.find(n => n.id === targetNoteId);

        if (!draggedNote || !targetNote) return;

        // Check if target is already in a stack
        if (targetNote.stackId) {
            // Add dragged note to existing stack
            this.addToStack(targetNote.stackId, this.draggedCard);
        } else if (draggedNote.stackId) {
            // Target not in stack, dragged is in stack - add target to stack
            this.addToStack(draggedNote.stackId, targetNoteId);
        } else {
            // Neither in stack - create new stack
            this.createStack([targetNoteId, this.draggedCard]);
        }

        this.render();
    }


    render() {
        // Update note count
        this.noteCountElement.textContent = `${this.notes.length} ${this.notes.length === 1 ? 'note' : 'notes'}`;

        // Update time statistics
        this.updateTimeStats();

        // Clear canvas
        this.notesCanvas.innerHTML = '';

        // Show welcome message if no notes
        if (this.notes.length === 0) {
            this.notesCanvas.appendChild(this.welcomeMessage);
            return;
        }

        // Group notes by stacks
        const renderedNotes = new Set();

        // Render stacks first
        this.stacks.forEach(stack => {
            const stackNotes = stack.noteIds
                .map(id => this.notes.find(n => n.id === id))
                .filter(n => n); // Remove null/undefined

            if (stackNotes.length > 0) {
                const stackContainer = this.createStackContainer(stack, stackNotes);
                this.notesCanvas.appendChild(stackContainer);
                stackNotes.forEach(note => renderedNotes.add(note.id));
            }
        });

        // Render individual notes (not in stacks)
        this.notes.forEach(note => {
            if (!renderedNotes.has(note.id)) {
                const noteCard = this.createNoteCard(note);
                this.notesCanvas.appendChild(noteCard);
            }
        });
    }

    updateTimeStats() {
        // Calculate time for each category
        const stats = {
            k: 0,
            h: 0,
            p: 0,
            none: 0,
            total: 0
        };

        this.notes.forEach(note => {
            const time = note.timeMinutes || 0;
            stats.total += time;

            if (note.category === 'k') {
                stats.k += time;
            } else if (note.category === 'h') {
                stats.h += time;
            } else if (note.category === 'p') {
                stats.p += time;
            } else {
                stats.none += time;
            }
        });

        // Build HTML
        let html = '';

        if (stats.k > 0) {
            html += `<div class="time-stat" data-category="k"><span class="time-stat-label">k:</span><span class="time-stat-value">${stats.k}m</span></div>`;
        }

        if (stats.h > 0) {
            html += `<div class="time-stat" data-category="h"><span class="time-stat-label">h:</span><span class="time-stat-value">${stats.h}m</span></div>`;
        }

        if (stats.p > 0) {
            html += `<div class="time-stat" data-category="p"><span class="time-stat-label">p:</span><span class="time-stat-value">${stats.p}m</span></div>`;
        }

        if (stats.none > 0) {
            html += `<div class="time-stat"><span class="time-stat-label">other:</span><span class="time-stat-value">${stats.none}m</span></div>`;
        }

        if (stats.total > 0) {
            html += `<div class="time-stat"><span class="time-stat-label">total:</span><span class="time-stat-value">${stats.total}m</span></div>`;
        }

        this.timeStatsElement.innerHTML = html;
    }

    createStackContainer(stack, stackNotes) {
        const container = document.createElement('div');
        container.className = 'stack-container';
        container.dataset.stackId = stack.id;

        // Add click handler to open stack modal
        container.addEventListener('click', (e) => {
            // Only trigger if clicking on the container itself or stacked cards
            // but not if clicking on buttons
            if (!e.target.closest('button')) {
                this.openStackModal(stack.id);
            }
        });

        // Add badge showing number of cards
        const badge = document.createElement('div');
        badge.className = 'stack-badge';
        badge.textContent = `${stackNotes.length} cards`;
        container.appendChild(badge);

        // Calculate total time for stack
        const totalTime = stackNotes.reduce((sum, note) => sum + (note.timeMinutes || 0), 0);

        // Display notes with last added on top
        stackNotes.forEach((note, index) => {
            const isTopCard = index === stackNotes.length - 1;
            const noteCard = this.createNoteCard(note, index, stackNotes.length, isTopCard ? totalTime : null);
            container.appendChild(noteCard);
        });

        return container;
    }

    createNoteCard(note, stackIndex = null, totalInStack = 1, stackTotalTime = null) {
        const card = document.createElement('div');
        card.className = 'note-card';
        if (note.completed) {
            card.classList.add('completed');
        }
        if (stackIndex !== null) {
            card.classList.add('stacked');
            card.style.setProperty('--stack-index', stackIndex);
            card.style.setProperty('--stack-total', totalInStack);
        }
        card.dataset.noteId = note.id;

        // Add category data attribute for color coding
        if (note.category) {
            card.dataset.category = note.category;
        }

        // Make card draggable
        card.draggable = true;
        card.addEventListener('dragstart', (e) => this.handleDragStart(e, note.id));
        card.addEventListener('dragend', (e) => this.handleDragEnd(e));
        card.addEventListener('dragover', (e) => this.handleDragOver(e));
        card.addEventListener('dragenter', (e) => this.handleDragEnter(e, note.id));
        card.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        card.addEventListener('drop', (e) => this.handleDrop(e, note.id));

        const header = document.createElement('div');
        header.className = 'note-header';

        // Left side (delete + time)
        const leftActions = document.createElement('div');
        leftActions.className = 'note-actions-left';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'note-delete';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNote(note.id);
        });

        const timeDisplay = document.createElement('span');
        timeDisplay.className = 'note-time';

        // If this is the top card of a stack, show total time
        if (stackTotalTime !== null && stackTotalTime > 0) {
            timeDisplay.textContent = `${stackTotalTime}m`;
            timeDisplay.classList.add('stack-total');
        } else if (note.timeMinutes) {
            timeDisplay.textContent = `${note.timeMinutes}m`;
        }

        leftActions.appendChild(deleteBtn);
        leftActions.appendChild(timeDisplay);

        // Right side (complete + edit menu)
        const rightActions = document.createElement('div');
        rightActions.className = 'note-actions-right';

        const completeBtn = document.createElement('button');
        completeBtn.className = 'note-complete';
        completeBtn.innerHTML = '&#9675;'; // Circle
        completeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleComplete(note.id);
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'note-edit';
        editBtn.innerHTML = '&#8942;'; // Vertical ellipsis (⋮)
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.enterEditMode(note.id);
        });

        rightActions.appendChild(completeBtn);
        rightActions.appendChild(editBtn);

        header.appendChild(leftActions);
        header.appendChild(rightActions);

        const content = document.createElement('div');
        content.className = 'note-content';
        content.textContent = note.content;

        card.appendChild(header);
        card.appendChild(content);

        return card;
    }

    createModalCard(note, isFirst, isLast) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.noteId = note.id;

        // Add category data attribute for color coding
        if (note.category) {
            card.dataset.category = note.category;
        }

        const header = document.createElement('div');
        header.className = 'note-header';

        // Left side (delete + time + reorder arrows)
        const leftActions = document.createElement('div');
        leftActions.className = 'note-actions-left';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'note-delete';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNote(note.id);
            // Refresh modal
            if (this.currentStackId) {
                setTimeout(() => this.openStackModal(this.currentStackId), 350);
            }
        });

        const timeDisplay = document.createElement('span');
        timeDisplay.className = 'note-time';
        if (note.timeMinutes) {
            timeDisplay.textContent = `${note.timeMinutes}m`;
        }

        // Reorder buttons
        const moveUpBtn = document.createElement('button');
        moveUpBtn.className = 'note-move-up';
        moveUpBtn.innerHTML = '&#8593;'; // ↑
        moveUpBtn.title = 'Nach oben';
        moveUpBtn.disabled = isFirst;
        moveUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveCardUp(note.id);
        });

        const moveDownBtn = document.createElement('button');
        moveDownBtn.className = 'note-move-down';
        moveDownBtn.innerHTML = '&#8595;'; // ↓
        moveDownBtn.title = 'Nach unten';
        moveDownBtn.disabled = isLast;
        moveDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveCardDown(note.id);
        });

        leftActions.appendChild(deleteBtn);
        leftActions.appendChild(timeDisplay);
        leftActions.appendChild(moveUpBtn);
        leftActions.appendChild(moveDownBtn);

        // Right side (unstack + complete + edit menu)
        const rightActions = document.createElement('div');
        rightActions.className = 'note-actions-right';

        const unstackBtn = document.createElement('button');
        unstackBtn.className = 'note-unstack';
        unstackBtn.innerHTML = '&#8690;'; // ⇢ Arrow
        unstackBtn.title = 'Aus Stack entfernen';
        unstackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.unstackNote(note.id);
        });

        const completeBtn = document.createElement('button');
        completeBtn.className = 'note-complete';
        completeBtn.innerHTML = '&#9675;'; // Circle
        completeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleComplete(note.id);
            // Refresh modal
            if (this.currentStackId) {
                setTimeout(() => this.openStackModal(this.currentStackId), 350);
            }
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'note-edit';
        editBtn.innerHTML = '&#8942;'; // Vertical ellipsis (⋮)
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.enterEditModeInModal(note.id);
        });

        rightActions.appendChild(unstackBtn);
        rightActions.appendChild(completeBtn);
        rightActions.appendChild(editBtn);

        header.appendChild(leftActions);
        header.appendChild(rightActions);

        const content = document.createElement('div');
        content.className = 'note-content';
        content.textContent = note.content;

        card.appendChild(header);
        card.appendChild(content);

        return card;
    }

    moveCardUp(noteId) {
        if (!this.currentStackId) return;

        const stack = this.stacks.find(s => s.id === this.currentStackId);
        if (!stack) return;

        const currentIndex = stack.noteIds.indexOf(noteId);
        if (currentIndex <= 0) return; // Already at top or not found

        // Swap with previous card
        [stack.noteIds[currentIndex - 1], stack.noteIds[currentIndex]] =
        [stack.noteIds[currentIndex], stack.noteIds[currentIndex - 1]];

        this.saveStacks();
        this.openStackModal(this.currentStackId);
    }

    moveCardDown(noteId) {
        if (!this.currentStackId) return;

        const stack = this.stacks.find(s => s.id === this.currentStackId);
        if (!stack) return;

        const currentIndex = stack.noteIds.indexOf(noteId);
        if (currentIndex === -1 || currentIndex >= stack.noteIds.length - 1) return; // Already at bottom or not found

        // Swap with next card
        [stack.noteIds[currentIndex], stack.noteIds[currentIndex + 1]] =
        [stack.noteIds[currentIndex + 1], stack.noteIds[currentIndex]];

        this.saveStacks();
        this.openStackModal(this.currentStackId);
    }

    unstackNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note || !note.stackId) return;

        const stackId = note.stackId;
        const stack = this.stacks.find(s => s.id === stackId);
        if (!stack) return;

        // Remove note from stack
        stack.noteIds = stack.noteIds.filter(id => id !== noteId);
        note.stackId = null;

        // Remove stack if only one card left
        if (stack.noteIds.length === 1) {
            const lastNoteId = stack.noteIds[0];
            const lastNote = this.notes.find(n => n.id === lastNoteId);
            if (lastNote) {
                lastNote.stackId = null;
            }
            this.stacks = this.stacks.filter(s => s.id !== stackId);
        }

        // Remove empty stacks
        this.stacks = this.stacks.filter(s => s.noteIds.length > 0);

        this.saveNotes();
        this.saveStacks();

        // Refresh modal or close if stack is gone
        if (stack.noteIds.length === 0) {
            this.closeStackModal();
        } else {
            this.openStackModal(stackId);
        }
    }

    enterEditModeInModal(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        const cardElement = this.stackModalBody.querySelector(`[data-note-id="${id}"]`);
        if (!cardElement) return;

        const contentElement = cardElement.querySelector('.note-content');
        if (!contentElement) return;

        // Store original content in case of cancel
        note._originalContent = note.content;
        note._originalCategory = note.category;
        note._originalTime = note.timeMinutes;

        // Build full edit string with category and time tags
        let editText = note.content;
        if (note.timeMinutes) {
            editText += ` ${note.timeMinutes}m`;
        }
        if (note.category) {
            editText += ` --${note.category}`;
        }

        // Make content editable
        contentElement.contentEditable = true;
        contentElement.textContent = editText;
        cardElement.classList.add('editing');
        cardElement.draggable = false; // Disable dragging while editing

        // Add hint
        const existingHint = cardElement.querySelector('.edit-hint');
        if (!existingHint) {
            const hint = document.createElement('div');
            hint.className = 'edit-hint';
            hint.textContent = 'Enter zum Speichern • ESC zum Abbrechen';
            cardElement.appendChild(hint);
        }

        // Focus and select text
        contentElement.focus();
        const range = document.createRange();
        range.selectNodeContents(contentElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Add keyboard event listeners
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveEditInModal(id);
                contentElement.removeEventListener('keydown', handleKeyDown);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEditInModal(id);
                contentElement.removeEventListener('keydown', handleKeyDown);
            }
        };

        contentElement.addEventListener('keydown', handleKeyDown);
    }

    cancelEditInModal(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        // Restore original content
        if (note._originalContent !== undefined) {
            note.content = note._originalContent;
            note.category = note._originalCategory;
            note.timeMinutes = note._originalTime;

            delete note._originalContent;
            delete note._originalCategory;
            delete note._originalTime;
        }

        // Refresh modal
        if (this.currentStackId) {
            this.openStackModal(this.currentStackId);
        }
    }

    saveEditInModal(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        const cardElement = this.stackModalBody.querySelector(`[data-note-id="${id}"]`);
        if (!cardElement) return;

        const contentElement = cardElement.querySelector('.note-content');
        if (!contentElement) return;

        let content = contentElement.textContent.trim();

        if (content === '') {
            // If empty, restore original
            this.cancelEditInModal(id);
            return;
        }

        // Parse content using same logic as addNote
        let category = null;
        const categoryMatch = content.match(/--([khp])$/);
        if (categoryMatch) {
            category = categoryMatch[1];
            content = content.replace(/\s*--[khp]$/, '').trim();
        }

        let timeMinutes = null;
        const timeMatch = content.match(/\s+(\d+)m$/);
        if (timeMatch) {
            timeMinutes = parseInt(timeMatch[1]);
            content = content.replace(/\s+\d+m$/, '').trim();
        }

        // Update note
        note.content = content;
        note.category = category;
        note.timeMinutes = timeMinutes;

        // Clean up temporary properties
        delete note._originalContent;
        delete note._originalCategory;
        delete note._originalTime;

        this.saveNotes();

        // Refresh modal
        if (this.currentStackId) {
            this.openStackModal(this.currentStackId);
        }
    }

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NotesApp();
});
