class NotesApp {
    constructor() {
        this.notes = [];
        this.stacks = [];
        this.noteInput = document.getElementById('noteInput');
        this.notesCanvas = document.getElementById('notesCanvas');
        this.kanbanView = document.getElementById('kanbanView');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.noteCountElement = document.querySelector('.note-count');
        this.timeStatsElement = document.getElementById('timeStats');
        this.stackModal = document.getElementById('stackModal');
        this.stackModalBody = document.getElementById('stackModalBody');
        this.stackModalClose = document.getElementById('stackModalClose');
        this.stackTitleInput = document.getElementById('stackTitleInput');
        this.stackTypeBtn = document.getElementById('stackTypeBtn');
        this.draggedCard = null;
        this.draggedStack = null;
        this.currentStackId = null;
        this.currentView = 'board'; // 'board' oder 'kanban'
        this.viewSwitchBtn = document.getElementById('viewSwitchBtn');

        // Work Timer
        this.workSidebar = document.getElementById('workSidebar');
        this.workTimeTotal = document.getElementById('workTimeTotal');
        this.workTimer = document.getElementById('workTimer');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startWorkBtn = document.getElementById('startWorkBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');

        this.timerState = {
            isRunning: false,
            isPaused: false,
            totalSeconds: 0,
            remainingSeconds: 0,
            intervalId: null
        };

        // Filters
        this.activeFilters = new Set();
        this.filterButtons = {
            k: document.getElementById('filterK'),
            h: document.getElementById('filterH'),
            p: document.getElementById('filterP'),
            time15: document.getElementById('filterTime15'),
            time30: document.getElementById('filterTime30'),
            time60: document.getElementById('filterTime60'),
            time60Plus: document.getElementById('filterTime60Plus'),
            dayUnassigned: document.getElementById('filterDayUnassigned'),
            dayMon: document.getElementById('filterDayMon'),
            dayTue: document.getElementById('filterDayTue'),
            dayWed: document.getElementById('filterDayWed'),
            dayThu: document.getElementById('filterDayThu'),
            dayFri: document.getElementById('filterDayFri'),
            daySat: document.getElementById('filterDaySat'),
            daySun: document.getElementById('filterDaySun')
        };
        this.clearFiltersBtn = document.getElementById('clearFilters');

        // Backup system
        this.backupFolderHandle = null;
        this.autoBackupInterval = null;
        this.selectBackupFolderBtn = document.getElementById('selectBackupFolder');
        this.manualBackupBtn = document.getElementById('manualBackup');
        this.importBackupBtn = document.getElementById('importBackup');
        this.backupStatusElement = document.getElementById('backupStatus');

        this.init();
    }

    async init() {
        // Load notes from localStorage
        this.loadNotes();

        // Event listeners
        this.noteInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // View switching button
        this.viewSwitchBtn.addEventListener('click', () => this.switchView());

        // Modal event listeners
        this.stackModalClose.addEventListener('click', () => this.closeStackModal());
        this.stackModal.querySelector('.stack-modal-overlay').addEventListener('click', () => this.closeStackModal());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.stackModal.style.display !== 'none') {
                this.closeStackModal();
            }
        });

        // Backup event listeners
        this.selectBackupFolderBtn.addEventListener('click', () => this.selectBackupFolder());
        this.manualBackupBtn.addEventListener('click', () => this.manualBackup());
        this.importBackupBtn.addEventListener('click', () => this.importBackup());

        // Work Timer event listeners
        this.startWorkBtn.addEventListener('click', () => this.startWork());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.stopBtn.addEventListener('click', () => this.stopWork());

        // Filter event listeners
        Object.values(this.filterButtons).forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleFilter(e.target.dataset.filter));
        });
        this.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());

        // Restore saved backup folder
        await this.restoreBackupFolder();

        // Start auto-backup (every 5 minutes)
        this.startAutoBackup();

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
            focused: false, // Scharfgestellt für aktive Aufgaben
            assignedDay: null, // 'monday', 'tuesday', ..., 'sunday' oder null
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

    toggleFocus(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.focused = !note.focused;
            this.saveNotes();
            this.render();
            this.updateWorkSidebar();
        }
    }

    // ========== Work Timer ==========

    getFocusedNotes() {
        return this.notes.filter(n => n.focused);
    }

    calculateFocusedTime() {
        const focusedNotes = this.getFocusedNotes();
        return focusedNotes.reduce((total, note) => total + (note.timeMinutes || 0), 0);
    }

    updateWorkSidebar() {
        const focusedNotes = this.getFocusedNotes();
        const totalMinutes = this.calculateFocusedTime();

        if (focusedNotes.length > 0) {
            // Show sidebar
            this.workSidebar.style.display = 'flex';

            // Update total time display
            if (totalMinutes >= 60) {
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                this.workTimeTotal.textContent = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            } else {
                this.workTimeTotal.textContent = `${totalMinutes}m`;
            }
        } else {
            // Hide sidebar if no focused notes
            this.workSidebar.style.display = 'none';
            // Stop timer if running
            if (this.timerState.isRunning) {
                this.stopWork();
            }
        }
    }

    startWork() {
        const totalMinutes = this.calculateFocusedTime();

        if (totalMinutes === 0) {
            alert('Keine Zeit in fokussierten Karten vorhanden!');
            return;
        }

        // Initialize timer
        this.timerState.isRunning = true;
        this.timerState.isPaused = false;
        this.timerState.totalSeconds = totalMinutes * 60;
        this.timerState.remainingSeconds = totalMinutes * 60;

        // Update UI
        this.startWorkBtn.style.display = 'none';
        this.workTimer.style.display = 'block';
        this.pauseBtn.textContent = '‖ Pause';

        // Start countdown
        this.timerState.intervalId = setInterval(() => {
            if (!this.timerState.isPaused) {
                this.timerState.remainingSeconds--;

                if (this.timerState.remainingSeconds <= 0) {
                    // Timer finished
                    this.stopWork();
                    alert('🎉 Arbeitszeit abgelaufen! Gut gemacht!');
                } else {
                    this.updateTimerDisplay();
                }
            }
        }, 1000);

        this.updateTimerDisplay();
    }

    togglePause() {
        if (!this.timerState.isRunning) return;

        this.timerState.isPaused = !this.timerState.isPaused;

        if (this.timerState.isPaused) {
            this.pauseBtn.textContent = '▸ Resume';
        } else {
            this.pauseBtn.textContent = '‖ Pause';
        }
    }

    stopWork() {
        // Clear interval
        if (this.timerState.intervalId) {
            clearInterval(this.timerState.intervalId);
            this.timerState.intervalId = null;
        }

        // Reset state
        this.timerState.isRunning = false;
        this.timerState.isPaused = false;
        this.timerState.remainingSeconds = 0;

        // Update UI
        this.startWorkBtn.style.display = 'block';
        this.workTimer.style.display = 'none';
        this.timerDisplay.textContent = '00:00:00';
    }

    updateTimerDisplay() {
        const hours = Math.floor(this.timerState.remainingSeconds / 3600);
        const minutes = Math.floor((this.timerState.remainingSeconds % 3600) / 60);
        const seconds = this.timerState.remainingSeconds % 60;

        const formatted = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');

        this.timerDisplay.textContent = formatted;
    }

    // ========== Filters ==========

    toggleFilter(filterType) {
        if (this.activeFilters.has(filterType)) {
            this.activeFilters.delete(filterType);
        } else {
            this.activeFilters.add(filterType);
        }

        this.updateFilterUI();
        this.render();
    }

    clearAllFilters() {
        this.activeFilters.clear();
        this.updateFilterUI();
        this.render();
    }

    updateFilterUI() {
        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (this.activeFilters.has(btn.dataset.filter)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Show/hide clear button
        if (this.activeFilters.size > 0) {
            this.clearFiltersBtn.style.display = 'block';
        } else {
            this.clearFiltersBtn.style.display = 'none';
        }
    }

    getFilteredNotes() {
        if (this.activeFilters.size === 0) {
            return this.notes;
        }

        return this.notes.filter(note => {
            // For notes in sequential stacks, only consider the top card (last in noteIds array)
            if (note.stackId) {
                const stack = this.stacks.find(s => s.id === note.stackId);
                if (stack && stack.type === 'sequential') {
                    // Only the last card in sequential stack is active (visually on top)
                    const isTopCard = stack.noteIds[stack.noteIds.length - 1] === note.id;
                    if (!isTopCard) {
                        // Blocked cards are filtered out
                        return false;
                    }
                }
            }

            // Check category filters
            const categoryFilters = ['category-k', 'category-h', 'category-p'];
            const activeCategoryFilters = categoryFilters.filter(f => this.activeFilters.has(f));

            if (activeCategoryFilters.length > 0) {
                const matchesCategory = activeCategoryFilters.some(filter => {
                    const cat = filter.split('-')[1];
                    return note.category === cat;
                });

                if (!matchesCategory) return false;
            }

            // Check time filters
            const timeFilters = ['time-0-15', 'time-16-30', 'time-31-60', 'time-60+'];
            const activeTimeFilters = timeFilters.filter(f => this.activeFilters.has(f));

            if (activeTimeFilters.length > 0) {
                const time = note.timeMinutes || 0;
                const matchesTime = activeTimeFilters.some(filter => {
                    if (filter === 'time-0-15') return time > 0 && time <= 15;
                    if (filter === 'time-16-30') return time >= 16 && time <= 30;
                    if (filter === 'time-31-60') return time >= 31 && time <= 60;
                    if (filter === 'time-60+') return time > 60;
                    return false;
                });

                if (!matchesTime) return false;
            }

            // Check day filters
            const dayFilters = ['day-unassigned', 'day-monday', 'day-tuesday', 'day-wednesday', 'day-thursday', 'day-friday', 'day-saturday', 'day-sunday'];
            const activeDayFilters = dayFilters.filter(f => this.activeFilters.has(f));

            if (activeDayFilters.length > 0) {
                const matchesDay = activeDayFilters.some(filter => {
                    const day = filter.split('-')[1];
                    if (day === 'unassigned') return !note.assignedDay;
                    return note.assignedDay === day;
                });

                if (!matchesDay) return false;
            }

            return true;
        });
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

        // Ensure stack has type property (migration for old stacks)
        if (!stack.type) {
            stack.type = 'group';
        }

        // Set stack title in input
        this.stackTitleInput.value = stack.title || '';

        // Update stack type button
        this.updateStackTypeButton(stack.type);

        // Remove previous event listeners if any
        if (this.stackTitleInput._changeHandler) {
            this.stackTitleInput.removeEventListener('input', this.stackTitleInput._changeHandler);
        }
        if (this.stackTypeBtn._clickHandler) {
            this.stackTypeBtn.removeEventListener('click', this.stackTypeBtn._clickHandler);
        }

        // Add event listener to save title on change
        const changeHandler = () => {
            stack.title = this.stackTitleInput.value.trim();
            this.saveStacks();
            this.render(); // Update main view to show title on top card
        };
        this.stackTitleInput.addEventListener('input', changeHandler);
        this.stackTitleInput._changeHandler = changeHandler;

        // Add event listener for type toggle
        const typeClickHandler = () => {
            stack.type = stack.type === 'group' ? 'sequential' : 'group';
            this.updateStackTypeButton(stack.type);
            this.saveStacks();
            this.render();
            // Refresh modal to update card states
            this.openStackModal(stackId);
        };
        this.stackTypeBtn.addEventListener('click', typeClickHandler);
        this.stackTypeBtn._clickHandler = typeClickHandler;

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
            // In sequential: last card (top of visual stack) is active, others are blocked
            const isBlocked = stack.type === 'sequential' && index < stackNotes.length - 1;
            const card = this.createModalCard(note, isFirst, isLast, isBlocked);
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

    updateStackTypeButton(type) {
        const icon = this.stackTypeBtn.querySelector('.stack-type-icon');
        const label = this.stackTypeBtn.querySelector('.stack-type-label');

        if (type === 'sequential') {
            icon.textContent = '→';
            label.textContent = 'Sequenz';
            this.stackTypeBtn.dataset.type = 'sequential';
            this.stackTypeBtn.classList.add('sequential');
        } else {
            icon.textContent = '+';
            label.textContent = 'Gruppe';
            this.stackTypeBtn.dataset.type = 'group';
            this.stackTypeBtn.classList.remove('sequential');
        }
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
            title: '',
            type: 'group', // 'group' or 'sequential'
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
        this.draggedStack = null;

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
        if (this.currentView === 'kanban') {
            this.renderKanban();
        } else {
            this.renderBoard();
        }
    }

    switchView() {
        this.currentView = this.currentView === 'board' ? 'kanban' : 'board';

        if (this.currentView === 'kanban') {
            this.notesCanvas.style.display = 'none';
            this.kanbanView.style.display = 'flex';
            this.viewSwitchBtn.querySelector('.view-icon').textContent = '⊟';
            this.viewSwitchBtn.querySelector('.view-label').textContent = 'Board';
        } else {
            this.notesCanvas.style.display = 'grid';
            this.kanbanView.style.display = 'none';
            this.viewSwitchBtn.querySelector('.view-icon').textContent = '⊞';
            this.viewSwitchBtn.querySelector('.view-label').textContent = 'Kanban';
        }

        this.render();
    }

    renderBoard() {
        // Get filtered notes
        const filteredNotes = this.getFilteredNotes();

        // Update note count
        const countText = this.activeFilters.size > 0
            ? `${filteredNotes.length} / ${this.notes.length} notes`
            : `${this.notes.length} ${this.notes.length === 1 ? 'note' : 'notes'}`;
        this.noteCountElement.textContent = countText;

        // Update time statistics
        this.updateTimeStats();

        // Update work sidebar
        this.updateWorkSidebar();

        // Clear canvas
        this.notesCanvas.innerHTML = '';

        // Show welcome message if no notes
        if (this.notes.length === 0) {
            this.notesCanvas.appendChild(this.welcomeMessage);
            return;
        }

        // Show "no results" message if filtered and empty
        if (filteredNotes.length === 0 && this.activeFilters.size > 0) {
            const noResults = document.createElement('div');
            noResults.className = 'welcome-message';
            noResults.innerHTML = '<h2>Keine Karten gefunden</h2><p>Versuche andere Filter...</p>';
            this.notesCanvas.appendChild(noResults);
            return;
        }

        // Create a Set of filtered note IDs for quick lookup
        const filteredIds = new Set(filteredNotes.map(n => n.id));

        // Group notes by stacks
        const renderedNotes = new Set();

        // Render stacks first (only if they contain filtered notes)
        this.stacks.forEach(stack => {
            const stackNotes = stack.noteIds
                .map(id => this.notes.find(n => n.id === id))
                .filter(n => n && filteredIds.has(n.id)); // Only include filtered notes

            if (stackNotes.length > 0) {
                const stackContainer = this.createStackContainer(stack, stackNotes);
                this.notesCanvas.appendChild(stackContainer);
                stackNotes.forEach(note => renderedNotes.add(note.id));
            }
        });

        // Render individual notes (not in stacks, and filtered)
        filteredNotes.forEach(note => {
            if (!renderedNotes.has(note.id)) {
                const noteCard = this.createNoteCard(note);
                this.notesCanvas.appendChild(noteCard);
            }
        });
    }

    renderKanban() {
        // Update time statistics and work sidebar
        this.updateTimeStats();
        this.updateWorkSidebar();

        // Get filtered notes (excluding day filters for Kanban)
        const filteredNotes = this.getFilteredNotesForKanban();
        const filteredIds = new Set(filteredNotes.map(n => n.id));

        const days = ['unassigned', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
            const columnBody = this.kanbanView.querySelector(`.kanban-column-body[data-day="${day}"]`);
            const countElement = this.kanbanView.querySelector(`.kanban-column[data-day="${day}"] .kanban-count`);

            if (!columnBody) return;

            // Clear column
            columnBody.innerHTML = '';

            // Add drag & drop event listeners to column (only if not already added)
            if (!columnBody._kanbanListenersAdded) {
                columnBody.addEventListener('dragover', (e) => this.handleKanbanDragOver(e));
                columnBody.addEventListener('dragenter', (e) => this.handleKanbanDragEnter(e, day));
                columnBody.addEventListener('dragleave', (e) => this.handleKanbanDragLeave(e));
                columnBody.addEventListener('drop', (e) => this.handleKanbanDrop(e, day));
                columnBody._kanbanListenersAdded = true;
            }

            // Get notes for this day (filtered by time/category)
            const dayNotes = (day === 'unassigned'
                ? this.notes.filter(note => !note.assignedDay)
                : this.notes.filter(note => note.assignedDay === day))
                .filter(note => filteredIds.has(note.id)); // Apply time/category filters

            // Update count
            countElement.textContent = dayNotes.length;

            // Calculate total time for this day (only top cards in stacks)
            let totalTime = 0;
            const countedNotes = new Set();

            // Count time from stacks (only top card)
            this.stacks.forEach(stack => {
                const stackNotes = stack.noteIds
                    .map(id => this.notes.find(n => n.id === id))
                    .filter(n => n && filteredIds.has(n.id));

                const allNotesInDay = stackNotes.every(note => {
                    if (day === 'unassigned') return !note.assignedDay;
                    return note.assignedDay === day;
                });

                if (allNotesInDay && stackNotes.length > 0) {
                    // Only count the top card
                    const topCard = stackNotes[stackNotes.length - 1];
                    if (topCard && topCard.timeMinutes) {
                        totalTime += topCard.timeMinutes;
                    }
                    stackNotes.forEach(note => countedNotes.add(note.id));
                }
            });

            // Count time from individual notes
            dayNotes.forEach(note => {
                if (!countedNotes.has(note.id) && note.timeMinutes) {
                    totalTime += note.timeMinutes;
                }
            });

            // Update time display
            const timeElement = this.kanbanView.querySelector(`.kanban-column[data-day="${day}"] .kanban-time-total`);
            if (timeElement) {
                timeElement.textContent = totalTime > 0 ? `${totalTime}m` : '0m';
            }

            // Group by stacks and individual notes
            const renderedNotes = new Set();

            // Render stacks first
            this.stacks.forEach(stack => {
                const stackNotes = stack.noteIds
                    .map(id => this.notes.find(n => n.id === id))
                    .filter(n => n && filteredIds.has(n.id)); // Apply filters

                // Check if all notes in stack belong to this day
                const allNotesInDay = stackNotes.every(note => {
                    if (day === 'unassigned') return !note.assignedDay;
                    return note.assignedDay === day;
                });

                if (allNotesInDay && stackNotes.length > 0) {
                    // Render stack container
                    const stackContainer = this.createKanbanStackContainer(stack, stackNotes);
                    columnBody.appendChild(stackContainer);
                    stackNotes.forEach(note => renderedNotes.add(note.id));
                }
            });

            // Render individual notes (not in stacks)
            dayNotes.forEach(note => {
                if (!renderedNotes.has(note.id)) {
                    const noteCard = this.createNoteCard(note);
                    columnBody.appendChild(noteCard);
                }
            });
        });
    }

    getFilteredNotesForKanban() {
        // Same as getFilteredNotes but excludes day filters
        if (this.activeFilters.size === 0) {
            return this.notes;
        }

        return this.notes.filter(note => {
            // For notes in sequential stacks, only consider the top card
            if (note.stackId) {
                const stack = this.stacks.find(s => s.id === note.stackId);
                if (stack && stack.type === 'sequential') {
                    const isTopCard = stack.noteIds[stack.noteIds.length - 1] === note.id;
                    if (!isTopCard) {
                        return false;
                    }
                }
            }

            // Check category filters
            const categoryFilters = ['category-k', 'category-h', 'category-p'];
            const activeCategoryFilters = categoryFilters.filter(f => this.activeFilters.has(f));

            if (activeCategoryFilters.length > 0) {
                const matchesCategory = activeCategoryFilters.some(filter => {
                    const cat = filter.split('-')[1];
                    return note.category === cat;
                });

                if (!matchesCategory) return false;
            }

            // Check time filters
            const timeFilters = ['time-0-15', 'time-16-30', 'time-31-60', 'time-60+'];
            const activeTimeFilters = timeFilters.filter(f => this.activeFilters.has(f));

            if (activeTimeFilters.length > 0) {
                const time = note.timeMinutes || 0;
                const matchesTime = activeTimeFilters.some(filter => {
                    if (filter === 'time-0-15') return time > 0 && time <= 15;
                    if (filter === 'time-16-30') return time >= 16 && time <= 30;
                    if (filter === 'time-31-60') return time >= 31 && time <= 60;
                    if (filter === 'time-60+') return time > 60;
                    return false;
                });

                if (!matchesTime) return false;
            }

            // Note: Day filters are NOT applied in Kanban view

            return true;
        });
    }

    createKanbanStackContainer(stack, stackNotes) {
        const container = document.createElement('div');
        container.className = 'stack-container';
        container.dataset.stackId = stack.id;

        // Make entire stack draggable, but prevent dragging when clicking on buttons
        container.draggable = true;
        container.addEventListener('dragstart', (e) => {
            // Don't start drag if clicking on a button
            if (e.target.closest('button')) {
                e.preventDefault();
                return false;
            }
            this.handleStackDragStart(e, stack.id);
        });
        container.addEventListener('dragend', (e) => this.handleDragEnd(e));

        // Render cards in stack
        stackNotes.forEach((note, index) => {
            // Calculate total time for stack
            const totalTime = stackNotes.reduce((sum, n) => sum + (n.timeMinutes || 0), 0);

            const isTopCard = index === stackNotes.length - 1;
            const card = this.createNoteCard(
                note,
                index,
                stackNotes.length,
                isTopCard ? totalTime : null,
                stack.title || null
            );

            // Add blocked class for non-top cards in sequential stacks
            if (stack.type === 'sequential' && !isTopCard) {
                card.classList.add('blocked');
            }

            // Make sure card buttons work in Kanban
            card.style.pointerEvents = 'auto';

            container.appendChild(card);
        });

        // Add stack badge
        const badge = document.createElement('div');
        badge.className = 'stack-badge';
        if (stack.type === 'sequential') {
            badge.classList.add('sequential-stack');
        }
        badge.textContent = `${stackNotes.length} cards`;
        badge.style.cursor = 'pointer';
        badge.style.pointerEvents = 'auto'; // Enable clicks on badge

        // Only badge opens modal, not the whole container
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openStackModal(stack.id);
        });

        container.appendChild(badge);

        return container;
    }

    handleStackDragStart(e, stackId) {
        this.draggedStack = stackId;
        e.dataTransfer.effectAllowed = 'move';
    }

    handleKanbanDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleKanbanDragEnter(e, day) {
        e.preventDefault();
        const column = e.target.closest('.kanban-column');
        if (column) {
            column.classList.add('drag-over-column');
        }
    }

    handleKanbanDragLeave(e) {
        const column = e.target.closest('.kanban-column');
        if (column && !column.contains(e.relatedTarget)) {
            column.classList.remove('drag-over-column');
        }
    }

    handleKanbanDrop(e, day) {
        e.preventDefault();
        e.stopPropagation();

        const column = e.target.closest('.kanban-column');
        if (column) {
            column.classList.remove('drag-over-column');
        }

        // Handle stack drag
        if (this.draggedStack) {
            const stack = this.stacks.find(s => s.id === this.draggedStack);
            if (stack) {
                // Assign all notes in stack to this day
                stack.noteIds.forEach(noteId => {
                    const note = this.notes.find(n => n.id === noteId);
                    if (note) {
                        note.assignedDay = day === 'unassigned' ? null : day;
                    }
                });
            }
            this.draggedStack = null;
            this.saveNotes();
            this.render();
            return;
        }

        // Handle single card drag
        if (!this.draggedCard) return;

        const draggedNote = this.notes.find(n => n.id === this.draggedCard);
        if (!draggedNote) return;

        // Assign note to day
        draggedNote.assignedDay = day === 'unassigned' ? null : day;

        this.saveNotes();
        this.render();
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
            html += `<div class="time-stat" data-category="k"><span class="time-stat-label">KSWIL:</span><span class="time-stat-value">${stats.k}m</span></div>`;
        }

        if (stats.h > 0) {
            html += `<div class="time-stat" data-category="h"><span class="time-stat-label">HSLU:</span><span class="time-stat-value">${stats.h}m</span></div>`;
        }

        if (stats.p > 0) {
            html += `<div class="time-stat" data-category="p"><span class="time-stat-label">Privat:</span><span class="time-stat-value">${stats.p}m</span></div>`;
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

        // Add sequential class if needed
        if (stack.type === 'sequential') {
            container.classList.add('sequential-stack');
        }

        // Add click handler to open stack modal
        container.addEventListener('click', (e) => {
            // Only trigger if clicking on the container itself or stacked cards
            // but not if clicking on buttons
            if (!e.target.closest('button')) {
                this.openStackModal(stack.id);
            }
        });

        // Add badge showing number of cards and type
        const badge = document.createElement('div');
        badge.className = 'stack-badge';
        const typeIcon = stack.type === 'sequential' ? '→' : '+';
        badge.textContent = `${typeIcon} ${stackNotes.length} cards`;
        container.appendChild(badge);

        // Calculate total time for stack
        // For sequential: only count the last card (visually on top, active)
        // For group: count all cards
        const totalTime = stack.type === 'sequential'
            ? (stackNotes[stackNotes.length - 1]?.timeMinutes || 0)
            : stackNotes.reduce((sum, note) => sum + (note.timeMinutes || 0), 0);

        // Display notes with last added on top
        stackNotes.forEach((note, index) => {
            const isTopCard = index === stackNotes.length - 1;
            const noteCard = this.createNoteCard(
                note,
                index,
                stackNotes.length,
                isTopCard ? totalTime : null,
                isTopCard ? stack.title : null
            );
            container.appendChild(noteCard);
        });

        return container;
    }

    createNoteCard(note, stackIndex = null, totalInStack = 1, stackTotalTime = null, stackTitle = null) {
        const card = document.createElement('div');
        card.className = 'note-card';
        if (note.completed) {
            card.classList.add('completed');
        }
        if (note.focused) {
            card.classList.add('focused');
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
        deleteBtn.draggable = false;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.deleteNote(note.id);
        });

        const timeDisplay = document.createElement('span');
        timeDisplay.className = 'note-time';

        leftActions.appendChild(deleteBtn);
        leftActions.appendChild(timeDisplay);

        // Center (focus button)
        const centerActions = document.createElement('div');
        centerActions.className = 'note-actions-center';

        const focusBtn = document.createElement('button');
        focusBtn.className = 'note-focus';
        focusBtn.innerHTML = '&#9679;'; // Filled circle
        focusBtn.title = 'Scharfstellen';
        focusBtn.draggable = false;
        if (note.focused) {
            focusBtn.classList.add('active');
        }
        focusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleFocus(note.id);
        });

        centerActions.appendChild(focusBtn);

        // Remove old time display code and move it here

        // If this is the top card of a stack, show individual + total time
        if (stackTotalTime !== null && stackTotalTime > 0) {
            if (note.timeMinutes) {
                timeDisplay.textContent = `${note.timeMinutes}m (${stackTotalTime}m)`;
            } else {
                timeDisplay.textContent = `${stackTotalTime}m`;
            }
            timeDisplay.classList.add('stack-total');
        } else if (note.timeMinutes) {
            timeDisplay.textContent = `${note.timeMinutes}m`;
        }

        // Right side (complete + edit menu)
        const rightActions = document.createElement('div');
        rightActions.className = 'note-actions-right';

        const completeBtn = document.createElement('button');
        completeBtn.className = 'note-complete';
        completeBtn.innerHTML = '&#9675;'; // Circle
        completeBtn.draggable = false;
        completeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleComplete(note.id);
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'note-edit';
        editBtn.innerHTML = '&#8942;'; // Vertical ellipsis (⋮)
        editBtn.draggable = false; // Prevent drag on button
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.enterEditMode(note.id);
        });

        rightActions.appendChild(completeBtn);
        rightActions.appendChild(editBtn);

        header.appendChild(leftActions);
        header.appendChild(centerActions);
        header.appendChild(rightActions);

        // Add stack title if present (above content)
        if (stackTitle && stackTitle.trim() !== '') {
            const titleElement = document.createElement('div');
            titleElement.className = 'stack-title';
            titleElement.textContent = stackTitle;
            card.appendChild(titleElement);
        }

        const content = document.createElement('div');
        content.className = 'note-content';
        content.textContent = note.content;

        card.appendChild(header);
        card.appendChild(content);

        return card;
    }

    createModalCard(note, isFirst, isLast, isBlocked = false) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.noteId = note.id;

        if (note.focused) {
            card.classList.add('focused');
        }

        if (isBlocked) {
            card.classList.add('blocked');
        }

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

        // Center (focus button)
        const centerActions = document.createElement('div');
        centerActions.className = 'note-actions-center';

        const focusBtn = document.createElement('button');
        focusBtn.className = 'note-focus';
        focusBtn.innerHTML = '&#9679;'; // Filled circle
        focusBtn.title = 'Scharfstellen';
        if (note.focused) {
            focusBtn.classList.add('active');
        }
        focusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFocus(note.id);
            // Refresh modal
            if (this.currentStackId) {
                setTimeout(() => this.openStackModal(this.currentStackId), 50);
            }
        });

        centerActions.appendChild(focusBtn);

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
        header.appendChild(centerActions);
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

    // ========== Backup System ==========

    async saveFolderHandleToIndexedDB(handle) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SimpleNotesBackup', 1);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['folderHandles'], 'readwrite');
                const store = transaction.objectStore('folderHandles');
                store.put(handle, 'backupFolder');

                transaction.oncomplete = () => {
                    db.close();
                    resolve();
                };

                transaction.onerror = () => reject(transaction.error);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('folderHandles')) {
                    db.createObjectStore('folderHandles');
                }
            };
        });
    }

    async loadFolderHandleFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SimpleNotesBackup', 1);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains('folderHandles')) {
                    db.close();
                    resolve(null);
                    return;
                }

                const transaction = db.transaction(['folderHandles'], 'readonly');
                const store = transaction.objectStore('folderHandles');
                const getRequest = store.get('backupFolder');

                getRequest.onsuccess = () => {
                    db.close();
                    resolve(getRequest.result);
                };

                getRequest.onerror = () => {
                    db.close();
                    reject(getRequest.error);
                };
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('folderHandles')) {
                    db.createObjectStore('folderHandles');
                }
            };
        });
    }

    async restoreBackupFolder() {
        try {
            const handle = await this.loadFolderHandleFromIndexedDB();

            if (!handle) {
                return; // No saved folder
            }

            // Check if we still have permission
            const permission = await handle.queryPermission({ mode: 'readwrite' });

            if (permission === 'granted') {
                // Permission already granted
                this.backupFolderHandle = handle;
                this.manualBackupBtn.disabled = false;
                this.updateBackupStatus('Auto-Backup aktiv');
                console.log('Backup-Ordner wiederhergestellt');
            } else {
                // Need to request permission again
                const newPermission = await handle.requestPermission({ mode: 'readwrite' });

                if (newPermission === 'granted') {
                    this.backupFolderHandle = handle;
                    this.manualBackupBtn.disabled = false;
                    this.updateBackupStatus('Auto-Backup aktiv');
                    console.log('Backup-Ordner wiederhergestellt (Berechtigung erneuert)');
                } else {
                    // Permission denied, clear saved handle
                    this.updateBackupStatus('Berechtigung verweigert');
                }
            }
        } catch (err) {
            console.error('Fehler beim Wiederherstellen des Backup-Ordners:', err);
            // Silently fail - user can select folder again
        }
    }

    async selectBackupFolder() {
        try {
            // Request folder picker
            this.backupFolderHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            // Save to IndexedDB
            await this.saveFolderHandleToIndexedDB(this.backupFolderHandle);

            // Enable manual backup button
            this.manualBackupBtn.disabled = false;

            // Update status
            this.updateBackupStatus('Auto-Backup aktiv');

            // Create initial backup
            await this.autoBackup();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Fehler beim Ordner-Auswahl:', err);
                this.updateBackupStatus('Fehler beim Auswählen');
            }
        }
    }

    async manualBackup() {
        if (!this.backupFolderHandle) {
            alert('Bitte zuerst einen Backup-Ordner auswählen!');
            return;
        }

        try {
            await this.autoBackup();
            this.updateBackupStatus('Backup erfolgreich', true);

            // Reset status after 2 seconds
            setTimeout(() => {
                this.updateBackupStatus('Auto-Backup aktiv');
            }, 2000);
        } catch (err) {
            console.error('Fehler beim manuellen Backup:', err);
            this.updateBackupStatus('Backup fehlgeschlagen');
        }
    }

    async autoBackup() {
        if (!this.backupFolderHandle) return;

        try {
            // Check if we still have permission
            const permission = await this.backupFolderHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const newPermission = await this.backupFolderHandle.requestPermission({ mode: 'readwrite' });
                if (newPermission !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            // Create backup data
            const backupData = {
                notes: this.notes,
                stacks: this.stacks,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            // Create filename with timestamp
            const now = new Date();
            const filename = `backup-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.json`;

            // Create or get file
            const fileHandle = await this.backupFolderHandle.getFileHandle(filename, { create: true });

            // Write to file
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(backupData, null, 2));
            await writable.close();

            console.log('Backup erstellt:', filename);
        } catch (err) {
            console.error('Auto-Backup Fehler:', err);
            // Reset folder handle if permission was lost
            if (err.name === 'NotAllowedError') {
                this.backupFolderHandle = null;
                this.manualBackupBtn.disabled = true;
                this.updateBackupStatus('Berechtigung verloren');
            }
        }
    }

    async importBackup() {
        try {
            // Open file picker
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Backup Files',
                    accept: { 'application/json': ['.json'] }
                }],
                multiple: false
            });

            // Read file
            const file = await fileHandle.getFile();
            const content = await file.text();
            const backupData = JSON.parse(content);

            // Validate backup data
            if (!backupData.notes || !Array.isArray(backupData.notes)) {
                throw new Error('Ungültiges Backup-Format');
            }

            // Confirm before restoring
            const confirmed = confirm(
                `Backup vom ${new Date(backupData.timestamp).toLocaleString('de-DE')} wiederherstellen?\n\n` +
                `Anzahl Notizen: ${backupData.notes.length}\n` +
                `Anzahl Stacks: ${backupData.stacks?.length || 0}\n\n` +
                `ACHTUNG: Aktuelle Daten werden überschrieben!`
            );

            if (!confirmed) return;

            // Restore data
            this.notes = backupData.notes;
            this.stacks = backupData.stacks || [];

            // Save to localStorage
            this.saveNotes();
            this.saveStacks();

            // Re-render
            this.render();

            alert('Backup erfolgreich wiederhergestellt!');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Import-Fehler:', err);
                alert('Fehler beim Importieren: ' + err.message);
            }
        }
    }

    startAutoBackup() {
        // Auto-backup every 5 minutes
        this.autoBackupInterval = setInterval(() => {
            this.autoBackup();
        }, 5 * 60 * 1000); // 5 minutes
    }

    updateBackupStatus(message, isSuccess = false) {
        this.backupStatusElement.textContent = message;
        if (isSuccess) {
            this.backupStatusElement.style.color = '#2ecc71';
            this.backupStatusElement.classList.add('success-pulse');
            setTimeout(() => {
                this.backupStatusElement.classList.remove('success-pulse');
            }, 500);
        } else {
            this.backupStatusElement.style.color = '#888';
        }
    }

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NotesApp();
});
