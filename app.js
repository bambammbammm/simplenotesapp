class NotesApp {
    constructor() {
        this.notes = [];
        this.stacks = [];
        this.stackViewActive = false; // Stack View mode (show all stacks expanded)
        this.noteInput = document.getElementById('noteInput');
        this.notesCanvas = document.getElementById('notesCanvas');
        this.calendarView = document.getElementById('calendarView');
        this.planView = document.getElementById('planView');
        this.planEditor = document.getElementById('planEditor');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.noteCountElement = document.querySelector('.note-count');
        this.timeStatsElement = document.getElementById('timeStats');
        this.draggedCard = null;
        this.draggedStack = null;
        this.currentStackId = null;
        this.currentView = 'board'; // 'board', 'calendar' or 'plan'
        this.viewSwitchBtn = document.getElementById('viewSwitchBtn');
        this.planText = ''; // Store plan text
        this.planInputDebounceTimer = null; // Debounce timer for plan input parsing
        this.newlyCreatedNoteIds = new Set(); // Track newly created notes for animation
        this.undoStack = []; // Stack of actions for undo functionality
        this.maxUndoStack = 10; // Maximum undo history
        this.currentFocusedTable = null; // Currently focused table for global table actions

        // Calendar state
        const today = new Date();
        this.currentMonth = today.getMonth(); // 0-11
        this.currentYear = today.getFullYear();

        // Calendar DOM elements
        this.calendarGrid = document.getElementById('calendarGrid');
        this.calendarBacklogBody = document.getElementById('calendarBacklogBody');
        this.calendarMonthTitle = document.getElementById('calendarMonthTitle');
        this.calendarPrevBtn = document.getElementById('calendarPrevBtn');
        this.calendarNextBtn = document.getElementById('calendarNextBtn');
        this.calendarTodayBtn = document.getElementById('calendarTodayBtn');
        this.backlogCount = document.getElementById('backlogCount');
        this.backlogTime = document.getElementById('backlogTime');

        // Saved Notes
        this.savedNotes = [];
        this.currentSavedNoteId = null; // Currently active saved note ID
        this.savedNotesSidebar = document.getElementById('savedNotesSidebar');
        this.savedNotesList = document.getElementById('savedNotesList');
        this.savedNotesCount = document.getElementById('savedNotesCount');
        this.planSaveBtn = document.getElementById('planSaveBtn');
        this.sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.savedNotesSidebarVisible = false;

        // Command Palette
        this.commandPalette = document.getElementById('commandPalette');
        this.commandPaletteBody = document.getElementById('commandPaletteBody');
        this.commandPaletteSelectedIndex = 0;
        this.commandPaletteCommands = [];
        this.commandPaletteKeyHeld = false;

        // Hamburger menu
        this.hamburgerMenuBtn = document.getElementById('hamburgerMenuBtn');
        this.hamburgerDropdown = document.getElementById('hamburgerDropdown');

        // Undo dropdown
        this.undoBtn = document.getElementById('undoBtn');
        this.undoCount = document.querySelector('.undo-count');
        this.undoDropdown = document.getElementById('undoDropdown');
        this.undoDropdownClose = document.getElementById('undoDropdownClose');
        this.undoHistoryList = document.getElementById('undoHistoryList');

        // Work Timer (UI Redesign: now in header)
        this.workSidebar = document.getElementById('headerWorkSection');
        this.workTimeTotal = document.getElementById('workTimeTotal');
        this.workTimer = document.getElementById('workTimer');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.endTimeDisplay = document.getElementById('endTimeDisplay'); // Optional (not in header)
        this.endTimeValue = document.getElementById('endTimeValue'); // Optional
        this.startWorkBtn = document.getElementById('startWorkBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.sessionSummary = document.getElementById('sessionSummaryModal'); // Changed from 'sessionSummary' to 'sessionSummaryModal'
        this.sessionSummaryClose = document.getElementById('sessionSummaryClose');
        this.sessionPlanned = document.getElementById('sessionPlanned');
        this.sessionActual = document.getElementById('sessionActual');
        this.sessionDifference = document.getElementById('sessionDifference');

        this.timerState = {
            isRunning: false,
            isPaused: false,
            totalSeconds: 0,
            remainingSeconds: 0,
            intervalId: null,
            startTime: null,
            endTime: null,
            initialPlannedMinutes: 0,
            pauseStartTime: null,  // When current pause started
            totalPausedMs: 0        // Total time paused in milliseconds
        };

        // Filters
        this.activeFilters = new Set();
        this.filterButtons = {
            k: document.getElementById('filterK'),
            h: document.getElementById('filterH'),
            p: document.getElementById('filterP'),
            u: document.getElementById('filterU'),
            class2a: document.getElementById('filterClass2a'),
            class2b: document.getElementById('filterClass2b'),
            class2c: document.getElementById('filterClass2c'),
            class3a: document.getElementById('filterClass3a'),
            class3b: document.getElementById('filterClass3b'),
            class5: document.getElementById('filterClass5'),
            time15: document.getElementById('filterTime15'),
            time30: document.getElementById('filterTime30'),
            time60: document.getElementById('filterTime60'),
            time60Plus: document.getElementById('filterTime60Plus'),
            priority1: document.getElementById('filterPriority1'),
            priority2: document.getElementById('filterPriority2'),
            priority3: document.getElementById('filterPriority3'),
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

        // Completed counter
        this.completedToday = 0;
        this.lastResetDate = null;
        this.completedCounterElement = document.getElementById('completedCounter');

        // Undo functionality
        this.init();
    }

    async init() {
        // Load notes from localStorage
        this.loadNotes();
        this.loadCompletedCounter();
        this.loadKanbanSettings();
        this.loadPlanText();
        this.loadSavedNotes();
        this.checkAndResetCounter();

        // Initialize undo button state
        this.updateUndoButton();

        // Event listeners
        this.noteInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyboard(e));

        // View switching button
        this.viewSwitchBtn.addEventListener('click', () => this.switchView());

        // Plan editor event listeners
        this.planEditor.addEventListener('input', () => {
            this.handlePlanInputDebounced();
            this.typewriterScroll();
        });
        this.planEditor.addEventListener('blur', () => this.savePlanText());
        this.planEditor.addEventListener('keydown', (e) => {
            this.handlePlanKeyDown(e);
            // Delay scroll slightly to wait for cursor position update
            setTimeout(() => this.typewriterScroll(), 0);
        });

        // Checkbox click handler
        this.planEditor.addEventListener('click', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                e.target.checked = !e.target.checked;
                this.savePlanText();
            }
        });

        // Floating Toolbar initialization
        this.floatingToolbar = document.getElementById('floatingToolbar');
        this.initFloatingToolbar();

        // Saved Notes event listeners
        this.planNewBtn = document.getElementById('planNewBtn');
        this.planSaveBtn.addEventListener('click', () => this.promptSavePlanNote());
        this.planNewBtn.addEventListener('click', () => this.createNewNote());
        this.sidebarToggleBtn.addEventListener('click', () => this.toggleSavedNotesSidebar());
        this.sidebarOverlay.addEventListener('click', () => this.toggleSavedNotesSidebar());

        // Global Table Action Buttons
        this.tableAddRowBtn = document.getElementById('tableAddRowBtn');
        this.tableAddColBtn = document.getElementById('tableAddColBtn');
        this.tableMoveRowUpBtn = document.getElementById('tableMoveRowUpBtn');
        this.tableMoveRowDownBtn = document.getElementById('tableMoveRowDownBtn');
        this.tableMoveColLeftBtn = document.getElementById('tableMoveColLeftBtn');
        this.tableMoveColRightBtn = document.getElementById('tableMoveColRightBtn');
        this.tableDeleteBtn = document.getElementById('tableDeleteBtn');

        this.tableAddRowBtn.addEventListener('click', () => this.addTableRow(this.currentFocusedTable));
        this.tableAddColBtn.addEventListener('click', () => this.addTableColumn(this.currentFocusedTable));
        this.tableMoveRowUpBtn.addEventListener('click', () => this.moveTableRow(this.currentFocusedTable, 'up'));
        this.tableMoveRowDownBtn.addEventListener('click', () => this.moveTableRow(this.currentFocusedTable, 'down'));
        this.tableMoveColLeftBtn.addEventListener('click', () => this.moveTableColumn(this.currentFocusedTable, 'left'));
        this.tableMoveColRightBtn.addEventListener('click', () => this.moveTableColumn(this.currentFocusedTable, 'right'));
        this.tableDeleteBtn.addEventListener('click', () => {
            if (this.currentFocusedTable) {
                const wrapper = this.currentFocusedTable.closest('.table-wrapper');
                if (wrapper) this.deleteTable(wrapper);
            }
        });

        // Command Palette event listeners
        this.commandPalette.querySelector('.command-palette-overlay').addEventListener('click', () => this.closeCommandPalette());

        // Listen for Cmd/Ctrl key release globally
        document.addEventListener('keyup', (e) => {
            if (this.commandPaletteKeyHeld && (e.key === 'Meta' || e.key === 'Control')) {
                this.executeSelectedCommand();
            }
        });

        // Calendar navigation buttons
        this.calendarPrevBtn.addEventListener('click', () => this.navigateCalendar(-1));
        this.calendarNextBtn.addEventListener('click', () => this.navigateCalendar(1));
        this.calendarTodayBtn.addEventListener('click', () => this.goToToday());

        // Hamburger menu
        this.hamburgerMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleHamburgerMenu();
        });

        // Close hamburger menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.hamburgerDropdown.style.display === 'block' &&
                !this.hamburgerDropdown.contains(e.target) &&
                !this.hamburgerMenuBtn.contains(e.target)) {
                this.closeHamburgerMenu();
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
        this.sessionSummaryClose.addEventListener('click', () => this.closeSessionSummary());

        // Undo dropdown event listeners
        this.undoBtn.addEventListener('click', () => this.toggleUndoDropdown());
        this.undoDropdownClose.addEventListener('click', () => this.closeUndoDropdown());
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.undoBtn.contains(e.target) && !this.undoDropdown.contains(e.target)) {
                this.closeUndoDropdown();
            }
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            // Undo: Cmd/Ctrl + Z (global)
            if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
                const target = e.target;

                // Allow native undo in Plan Editor (contenteditable)
                if (target.id === 'planEditor') {
                    return; // Let browser handle native text undo
                }

                // Allow native undo in regular input/textarea fields
                const isTypingField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
                if (isTypingField) {
                    return; // Let browser handle native text undo
                }

                // For everything else (clicking on canvas, notes, etc.), trigger task undo
                e.preventDefault();
                this.undo();
            }

            // Stack View Toggle: 's' key (only in Board view)
            if (e.key === 's' && !cmdOrCtrl) {
                const target = e.target;

                // Don't trigger if typing in input/textarea or contenteditable
                const isTypingField = target.tagName === 'INPUT' ||
                                     target.tagName === 'TEXTAREA' ||
                                     target.isContentEditable;
                if (isTypingField) {
                    return;
                }

                // Only toggle in Board view
                if (this.notesCanvas.style.display !== 'none') {
                    e.preventDefault();
                    this.toggleStackView();
                }
            }
        });

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

    handleGlobalKeyboard(e) {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        // Don't handle shortcuts when typing in input fields or contenteditable
        // EXCEPT for specific cases like Cmd+↑/↓, Cmd+S
        const isTyping = e.target.tagName === 'INPUT' ||
                        e.target.tagName === 'TEXTAREA' ||
                        e.target.isContentEditable;

        // Cmd/Ctrl+↑ or Cmd/Ctrl+↓ → Open Command Palette or Navigate
        if (cmdOrCtrl && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault(); // Prevent cursor movement in contenteditable

            if (this.commandPalette.style.display === 'none') {
                // Open palette
                this.openCommandPalette();
            } else {
                // Navigate in open palette
                if (e.key === 'ArrowDown') {
                    this.navigateCommandPalette(1);
                } else {
                    this.navigateCommandPalette(-1);
                }
            }
            return;
        }

        // Cmd/Ctrl+S → Save (Plan View only)
        if (cmdOrCtrl && e.key === 's') {
            if (this.currentView === 'plan') {
                e.preventDefault();
                this.promptSavePlanNote();
                return;
            }
        }

        // ESC → Close modals / Clear filters
        if (e.key === 'Escape') {
            // Close command palette if open
            if (this.commandPalette.style.display !== 'none') {
                this.closeCommandPalette();
                return;
            }

            // Close hamburger menu if open
            if (this.hamburgerDropdown.style.display === 'block') {
                this.closeHamburgerMenu();
                return;
            }

            // Clear filters if any are active
            if (this.activeFilters.size > 0) {
                this.clearAllFilters();
                return;
            }

            // If in Plan View and not in saved note, clear editor
            if (this.currentView === 'plan' && !isTyping && !this.currentSavedNoteId) {
                this.planEditor.innerHTML = '';
                return;
            }
        }
    }

    addNote() {
        let content = this.noteInput.value.trim();

        if (content === '') return;

        // Check for category tags FIRST (e.g., --k, --h, --p, --u2a, --u3b, etc.)
        let category = null;
        let uClass = null;
        const uCategoryMatch = content.match(/--u(2a|2b|2c|3a|3b|5)$/);
        if (uCategoryMatch) {
            category = 'u';
            uClass = uCategoryMatch[1];
            content = content.replace(/\s*--u(2a|2b|2c|3a|3b|5)$/, '').trim();
        } else {
            const categoryMatch = content.match(/--([khp])$/);
            if (categoryMatch) {
                category = categoryMatch[1];
                content = content.replace(/\s*--[khp]$/, '').trim();
            }
        }

        // Then check for priority (e.g., !, !!, !!!)
        let priority = null;
        const priorityMatch = content.match(/\s+(!!!|!!|!)$/);
        if (priorityMatch) {
            priority = priorityMatch[1];
            content = content.replace(/\s+(!!!|!!|!)$/, '').trim();
        }

        // Finally check for time estimate (e.g., 15m, 30m, 125m)
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
            uClass: uClass, // For --u category: '2a', '2b', '2c', '3a', '3b', '5'
            priority: priority,
            timeMinutes: timeMinutes,
            focused: false, // Scharfgestellt für aktive Aufgaben
            assignedDay: null, // 'monday', 'tuesday', ..., 'sunday' oder null
        };

        this.notes.unshift(note); // Add to beginning of array
        this.saveNotes();
        this.noteInput.value = '';

        // Close input modal if it's open
        if (window.UI_REDESIGN && window.UI_REDESIGN.closeInputModal) {
            window.UI_REDESIGN.closeInputModal();
        }

        this.render();

        // Add to undo stack
        this.addToUndoStack({
            type: 'createNote',
            data: {
                noteId: note.id
            }
        });
    }

    deleteNote(id, skipAnimation = false) {
        if (skipAnimation) {
            // Save note for undo BEFORE deleting
            const noteToDelete = this.notes.find(note => note.id === id);

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

            // Add to undo stack
            if (noteToDelete) {
                this.addToUndoStack({
                    type: 'deleteNote',
                    data: {
                        note: noteToDelete
                    }
                });
            }
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
            // Check if this note was focused and timer is running
            const wasFocused = note.focused === true;
            const timerWasRunning = this.timerState.isRunning;

            // Save note for undo BEFORE deleting
            const noteToComplete = { ...note };

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

                    // Increment completed counter (only for circle button)
                    this.completedToday++;
                    this.saveCompletedCounter();
                    this.updateCompletedCounter();

                    this.saveNotes();
                    this.saveStacks();
                    this.render();

                    // Update task icons in plan mode to reflect completion
                    this.updatePlanTaskIcons();

                    // Recalculate timer if it was running and note was focused
                    if (timerWasRunning && wasFocused) {
                        this.recalculateTimer();
                    }

                    // Add to undo stack
                    this.addToUndoStack({
                        type: 'completeNote',
                        data: {
                            noteId: noteToComplete.id,
                            note: noteToComplete
                        }
                    });
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

    focusAllStackTasks(stackId) {
        const stack = this.stacks.find(s => s.id === stackId);
        if (!stack) return;

        // Get all notes in this stack
        const stackNotes = stack.noteIds
            .map(id => this.notes.find(n => n.id === id))
            .filter(n => n);

        // Check if all are already focused
        const allFocused = stackNotes.every(n => n.focused);

        // Toggle: if all focused, unfocus all; otherwise focus all
        stackNotes.forEach(note => {
            note.focused = !allFocused;
        });

        this.saveNotes();
        this.render();
        this.updateWorkSidebar();

        // Refresh modal to show updated focus states (use new Task Creator Modal)
        if (window.TaskCreatorModal && window.TaskCreatorModal.openModalForEdit) {
            setTimeout(() => window.TaskCreatorModal.openModalForEdit(stackId, 'stack'), 50);
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
            // Check if session summary is visible - if so, keep sidebar open
            const sessionSummaryVisible = this.sessionSummary.style.display !== 'none';

            if (!sessionSummaryVisible) {
                // Hide sidebar if no focused notes and no summary shown
                this.workSidebar.style.display = 'none';
            }

            // DON'T stop timer here - let recalculateTimer() handle it
            // The timer will be stopped by recalculateTimer() or showSessionSummary()
        }
    }

    startWork() {
        const totalMinutes = this.calculateFocusedTime();

        if (totalMinutes === 0) {
            alert('Keine Zeit in fokussierten Karten vorhanden!');
            return;
        }

        // Initialize timer with start and end time
        const now = Date.now();
        this.timerState.isRunning = true;
        this.timerState.isPaused = false;
        this.timerState.totalSeconds = totalMinutes * 60;
        this.timerState.startTime = now;
        this.timerState.endTime = now + (totalMinutes * 60 * 1000);
        this.timerState.initialPlannedMinutes = totalMinutes; // Save initial planned time
        this.timerState.pauseStartTime = null;
        this.timerState.totalPausedMs = 0;

        // Hide session summary if still visible
        this.sessionSummary.style.display = 'none';

        // Update UI
        this.startWorkBtn.style.display = 'none';
        this.workTimer.style.display = 'flex';
        this.pauseBtn.textContent = '‖ Pause';

        // Show and update end time display (if exists)
        if (this.endTimeDisplay) {
            this.endTimeDisplay.style.display = 'flex';
            this.updateEndTimeDisplay();
        }

        // Start countdown - uses real time calculation
        this.timerState.intervalId = setInterval(() => {
            if (!this.timerState.isPaused) {
                // Calculate remaining time based on actual clock time
                const now = Date.now();
                const elapsed = now - this.timerState.startTime - this.timerState.totalPausedMs;
                const totalDuration = this.timerState.totalSeconds * 1000;
                const remaining = totalDuration - elapsed;

                if (remaining <= 0) {
                    // Timer finished naturally
                    this.timerState.remainingSeconds = 0;
                    this.showSessionSummary(true);
                } else {
                    this.timerState.remainingSeconds = Math.ceil(remaining / 1000);
                    this.updateTimerDisplay();
                }
            } else {
                // Update end time display during pause (if exists)
                if (this.endTimeDisplay) {
                    this.updateEndTimeDisplay();
                }
            }
        }, 1000);

        this.updateTimerDisplay();
    }

    togglePause() {
        if (!this.timerState.isRunning) return;

        this.timerState.isPaused = !this.timerState.isPaused;

        if (this.timerState.isPaused) {
            // Starting pause - record when it started
            this.timerState.pauseStartTime = Date.now();
            this.pauseBtn.textContent = '▸ Resume';
        } else {
            // Ending pause - add to total paused time
            if (this.timerState.pauseStartTime) {
                const pauseDuration = Date.now() - this.timerState.pauseStartTime;
                this.timerState.totalPausedMs += pauseDuration;
                this.timerState.pauseStartTime = null;
            }
            this.pauseBtn.textContent = '‖ Pause';
        }

        // Update end time display to reflect pause (if exists)
        if (this.endTimeDisplay) {
            this.updateEndTimeDisplay();
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
        this.timerState.startTime = null;
        this.timerState.endTime = null;
        this.timerState.pauseStartTime = null;
        this.timerState.totalPausedMs = 0;

        // Update UI
        this.startWorkBtn.style.display = 'block';
        this.workTimer.style.display = 'none';
        if (this.endTimeDisplay) {
            this.endTimeDisplay.style.display = 'none';
        }
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

    updateEndTimeDisplay() {
        if (!this.timerState.startTime) return;

        // Calculate actual end time including paused time
        const totalDuration = this.timerState.totalSeconds * 1000;
        const currentPausedTime = this.timerState.isPaused && this.timerState.pauseStartTime
            ? Date.now() - this.timerState.pauseStartTime
            : 0;
        const totalPaused = this.timerState.totalPausedMs + currentPausedTime;
        const actualEndTime = new Date(this.timerState.startTime + totalDuration + totalPaused);

        const hours = actualEndTime.getHours();
        const minutes = actualEndTime.getMinutes();

        const formatted = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0')
        ].join(':');

        this.endTimeValue.textContent = formatted;
    }

    recalculateTimer() {
        if (!this.timerState.isRunning) {
            return;
        }

        // Calculate new total time from remaining focused tasks
        const newTotalMinutes = this.calculateFocusedTime();

        if (newTotalMinutes === 0) {
            // No more focused tasks, show session summary
            this.showSessionSummary(false);
            return;
        }

        // Calculate new end time based on current time + remaining work
        const now = new Date();
        this.timerState.totalSeconds = newTotalMinutes * 60;
        this.timerState.remainingSeconds = newTotalMinutes * 60;
        this.timerState.endTime = new Date(now.getTime() + newTotalMinutes * 60 * 1000);

        // Update displays
        this.updateTimerDisplay();
        if (this.endTimeDisplay) {
            this.updateEndTimeDisplay();
        }
    }

    showSessionSummary(timerRanOut) {
        console.log('showSessionSummary called, timerRanOut:', timerRanOut);

        // Calculate actual time elapsed
        const now = Date.now();
        const elapsedMs = now - this.timerState.startTime; // startTime is already a timestamp
        const actualMinutes = Math.round(elapsedMs / 60000);

        const plannedMinutes = this.timerState.initialPlannedMinutes;
        const differenceMinutes = plannedMinutes - actualMinutes;

        console.log('Session stats - Planned:', plannedMinutes, 'Actual:', actualMinutes, 'Difference:', differenceMinutes);

        // Save session data to localStorage
        const sessionData = {
            plannedMinutes,
            actualMinutes,
            differenceMinutes,
            timestamp: Date.now()
        };
        localStorage.setItem('lastSessionData', JSON.stringify(sessionData));

        // Clear interval and reset timer state
        if (this.timerState.intervalId) {
            clearInterval(this.timerState.intervalId);
            this.timerState.intervalId = null;
        }

        this.timerState.isRunning = false;
        this.timerState.isPaused = false;
        this.timerState.remainingSeconds = 0;

        // Hide timer, show start button, but keep sidebar visible
        this.workTimer.style.display = 'none';
        if (this.endTimeDisplay) {
            this.endTimeDisplay.style.display = 'none';
        }
        this.startWorkBtn.style.display = 'block';
        this.workSidebar.style.display = 'flex'; // Ensure sidebar stays visible

        // Update summary content
        this.sessionPlanned.textContent = `${plannedMinutes}m`;
        this.sessionActual.textContent = `${actualMinutes}m`;

        // Clear previous classes
        this.sessionDifference.className = 'session-difference';

        if (differenceMinutes > 0) {
            // Faster than planned
            this.sessionDifference.classList.add('faster');
            this.sessionDifference.textContent = `${differenceMinutes}m schneller! 🎉`;
        } else if (differenceMinutes < 0) {
            // Slower than planned
            this.sessionDifference.classList.add('slower');
            this.sessionDifference.textContent = `${Math.abs(differenceMinutes)}m länger gebraucht`;
        } else {
            // Exact
            this.sessionDifference.classList.add('exact');
            this.sessionDifference.textContent = 'Genau nach Plan! 👌';
        }

        // Show summary modal
        console.log('Showing session summary modal, element:', this.sessionSummary);
        if (this.sessionSummary) {
            this.sessionSummary.style.display = 'flex';
            console.log('Modal display set to flex');
        } else {
            console.error('sessionSummary element not found!');
        }

        // Update header display
        this.updateTimeStats();

        // Show alert based on how session ended
        if (timerRanOut) {
            setTimeout(() => alert('🎉 Arbeitszeit abgelaufen!'), 100);
        } else {
            setTimeout(() => alert('✅ Alle fokussierten Aufgaben erledigt!'), 100);
        }
    }

    closeSessionSummary() {
        this.sessionSummary.style.display = 'none';

        // Hide sidebar if no focused notes left
        const focusedNotes = this.getFocusedNotes();
        if (focusedNotes.length === 0) {
            this.workSidebar.style.display = 'none';
        }
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

    passesFilters(note) {
        // If no filters active, all notes pass
        if (this.activeFilters.size === 0) {
            return true;
        }

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
        const categoryFilters = ['category-k', 'category-h', 'category-p', 'category-u'];
        const activeCategoryFilters = categoryFilters.filter(f => this.activeFilters.has(f));

        if (activeCategoryFilters.length > 0) {
            const matchesCategory = activeCategoryFilters.some(filter => {
                const cat = filter.split('-')[1];
                return note.category === cat;
            });

            if (!matchesCategory) return false;
        }

        // Check class filters (for --u category)
        const classFilters = ['class-2a', 'class-2b', 'class-2c', 'class-3a', 'class-3b', 'class-5'];
        const activeClassFilters = classFilters.filter(f => this.activeFilters.has(f));

        if (activeClassFilters.length > 0) {
            const matchesClass = activeClassFilters.some(filter => {
                const cls = filter.split('-')[1];
                return note.category === 'u' && note.uClass === cls;
            });

            if (!matchesClass) return false;
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

        // Check priority filters
        const priorityFilters = ['priority-1', 'priority-2', 'priority-3'];
        const activePriorityFilters = priorityFilters.filter(f => this.activeFilters.has(f));

        if (activePriorityFilters.length > 0) {
            const matchesPriority = activePriorityFilters.some(filter => {
                if (filter === 'priority-1') return note.priority === '!';
                if (filter === 'priority-2') return note.priority === '!!';
                if (filter === 'priority-3') return note.priority === '!!!';
                return false;
            });

            if (!matchesPriority) return false;
        }

        // Check day filters (diese Woche)
        const dayFilters = ['day-unassigned', 'day-monday', 'day-tuesday', 'day-wednesday', 'day-thursday', 'day-friday', 'day-saturday', 'day-sunday'];
        const activeDayFilters = dayFilters.filter(f => this.activeFilters.has(f));

        if (activeDayFilters.length > 0) {
            const matchesDay = activeDayFilters.some(filter => {
                const day = filter.split('-')[1];
                if (day === 'unassigned') return !note.dueDate;

                // Calculate date for this weekday (this week)
                const targetDate = this.getDateForWeekday(day);
                return note.dueDate === targetDate;
            });

            if (!matchesDay) return false;
        }

        return true;
    }

    getDateForWeekday(weekday) {
        // Convert weekday name to ISO date string (YYYY-MM-DD) for this week
        const dayMap = {
            monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
            friday: 5, saturday: 6, sunday: 0
        };

        const targetDay = dayMap[weekday];
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Calculate difference (0 = Sunday to Monday = 1 day forward)
        let diff = targetDay - currentDay;

        // If target is Sunday (0) and we're past Monday, go to next Sunday
        if (targetDay === 0 && currentDay !== 0) {
            diff = 7 - currentDay;
        }

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + diff);

        // Return ISO format YYYY-MM-DD
        return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    }

    getFilteredNotes() {
        if (this.activeFilters.size === 0) {
            return this.notes;
        }

        return this.notes.filter(note => this.passesFilters(note));
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
        note._originalUClass = note.uClass;
        note._originalPriority = note.priority;
        note._originalTime = note.timeMinutes;

        // Build full edit string with category, priority and time tags
        let editText = note.content;
        if (note.timeMinutes) {
            editText += ` ${note.timeMinutes}m`;
        }
        if (note.priority) {
            editText += ` ${note.priority}`;
        }
        if (note.category === 'u' && note.uClass) {
            editText += ` --u${note.uClass}`;
        } else if (note.category) {
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
            note.uClass = note._originalUClass;
            note.priority = note._originalPriority;
            note.timeMinutes = note._originalTime;

            delete note._originalContent;
            delete note._originalCategory;
            delete note._originalUClass;
            delete note._originalPriority;
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

        // Check if content actually changed
        const hasChanged =
            note._originalContent !== undefined &&
            (content !== note._originalContent ||
             note._originalCategory !== note.category ||
             note._originalPriority !== note.priority ||
             note._originalTime !== note.timeMinutes);

        // Note: Edit operations currently don't support undo
        // to keep the undo system focused on create/delete/complete operations

        // Parse content using same logic as addNote
        // Check for category tags FIRST (e.g., --k, --h, --p, --u2a, --u3b, etc.)
        let category = null;
        let uClass = null;
        const uCategoryMatch = content.match(/--u(2a|2b|2c|3a|3b|5)$/);
        if (uCategoryMatch) {
            category = 'u';
            uClass = uCategoryMatch[1];
            content = content.replace(/\s*--u(2a|2b|2c|3a|3b|5)$/, '').trim();
        } else {
            const categoryMatch = content.match(/--([khp])$/);
            if (categoryMatch) {
                category = categoryMatch[1];
                content = content.replace(/\s*--[khp]$/, '').trim();
            }
        }

        // Then check for priority (e.g., !, !!, !!!)
        let priority = null;
        const priorityMatch = content.match(/\s+(!!!|!!|!)$/);
        if (priorityMatch) {
            priority = priorityMatch[1];
            content = content.replace(/\s+(!!!|!!|!)$/, '').trim();
        }

        // Finally check for time estimate (e.g., 15m, 30m, 125m)
        let timeMinutes = null;
        const timeMatch = content.match(/\s+(\d+)m$/);
        if (timeMatch) {
            timeMinutes = parseInt(timeMatch[1]);
            content = content.replace(/\s+\d+m$/, '').trim();
        }

        // Update note
        note.content = content;
        note.category = category;
        note.uClass = uClass;
        note.priority = priority;
        note.timeMinutes = timeMinutes;

        // Clean up temporary properties
        delete note._originalContent;
        delete note._originalCategory;
        delete note._originalUClass;
        delete note._originalPriority;
        delete note._originalTime;

        this.saveNotes();
        this.render();
    }

    openStackModal(stackId) {
        // Redirect to new Task Creator Modal
        if (window.TaskCreatorModal && window.TaskCreatorModal.openModalForEdit) {
            window.TaskCreatorModal.openModalForEdit(stackId, 'stack');
        }
    }

    closeStackModal() {
        // Redirect to new Task Creator Modal
        if (window.TaskCreatorModal && window.TaskCreatorModal.closeModal) {
            window.TaskCreatorModal.closeModal();
        }
    }

    updateStackTypeButton(type) {
        // This function is no longer needed as we use the Task Creator Modal
        // Kept for backward compatibility but does nothing
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

        // Migration: assignedDay → dueDate (v103)
        this.migrateAssignedDayToDueDate();
    }

    migrateAssignedDayToDueDate() {
        // Migrate old notes with assignedDay to new dueDate system
        let migrated = false;

        this.notes.forEach(note => {
            if (note.assignedDay) {
                // Map old weekday to date of this week
                note.dueDate = this.getDateForWeekday(note.assignedDay);
                delete note.assignedDay;
                migrated = true;
            }
        });

        if (migrated) {
            console.log('Migrated notes from assignedDay to dueDate');
            this.saveNotes();
        }
    }

    saveStacks() {
        localStorage.setItem('simpleStacks', JSON.stringify(this.stacks));
    }

    loadKanbanSettings() {
        const saved = localStorage.getItem('kanbanSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.unassignedCollapsed = settings.unassignedCollapsed || false;
        }
    }

    saveKanbanSettings() {
        const settings = {
            unassignedCollapsed: this.unassignedCollapsed
        };
        localStorage.setItem('kanbanSettings', JSON.stringify(settings));
    }

    toggleUnassignedCollapse() {
        this.unassignedCollapsed = !this.unassignedCollapsed;
        this.saveKanbanSettings();
        this.updateUnassignedColumnState();
    }

    updateUnassignedColumnState() {
        const unassignedColumn = this.kanbanView.querySelector('.kanban-column[data-day="unassigned"]');
        const collapseIcon = this.collapseUnassignedBtn.querySelector('.collapse-icon');

        if (this.unassignedCollapsed) {
            unassignedColumn.classList.add('collapsed');
            collapseIcon.textContent = '›';
            this.collapseUnassignedBtn.title = 'Spalte aufklappen';
        } else {
            unassignedColumn.classList.remove('collapsed');
            collapseIcon.textContent = '‹';
            this.collapseUnassignedBtn.title = 'Spalte zuklappen';
        }
    }

    toggleHamburgerMenu() {
        if (this.hamburgerDropdown.style.display === 'none' || !this.hamburgerDropdown.style.display) {
            this.hamburgerDropdown.style.display = 'block';
        } else {
            this.hamburgerDropdown.style.display = 'none';
        }
    }

    closeHamburgerMenu() {
        this.hamburgerDropdown.style.display = 'none';
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
        e.dataTransfer.setData('text/plain', noteId);
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
        if (this.currentView === 'calendar') {
            this.renderCalendar();
        } else {
            this.renderBoard();
        }
    }

    switchView() {
        // Auto-save current note if leaving plan view
        if (this.currentView === 'plan' && this.currentSavedNoteId) {
            const currentNote = this.savedNotes.find(n => n.id === this.currentSavedNoteId);
            if (currentNote) {
                const plainText = this.getPlainText();
                if (plainText && plainText.trim().length > 0) {
                    currentNote.content = this.planEditor.innerHTML;
                    currentNote.plainText = plainText;
                    currentNote.updatedAt = Date.now();
                    localStorage.setItem('savedPlanNotes', JSON.stringify(this.savedNotes));
                }
            }
        }

        // Cycle through: board → calendar → plan → board
        if (this.currentView === 'board') {
            this.currentView = 'calendar';
        } else if (this.currentView === 'calendar') {
            this.currentView = 'plan';
        } else {
            this.currentView = 'board';
        }

        // Hide all views
        this.notesCanvas.style.display = 'none';
        this.calendarView.style.display = 'none';
        this.planView.style.display = 'none';

        // Show current view and update button
        if (this.currentView === 'calendar') {
            this.calendarView.style.display = 'flex';
            this.viewSwitchBtn.querySelector('.view-icon').textContent = '✎';
            this.viewSwitchBtn.querySelector('.view-label').textContent = 'Plan';
            document.body.classList.remove('zen-mode'); // Remove zen mode
        } else if (this.currentView === 'plan') {
            this.planView.style.display = 'flex';
            this.viewSwitchBtn.querySelector('.view-icon').textContent = '⊟';
            this.viewSwitchBtn.querySelector('.view-label').textContent = 'Board';
            // Focus on plan editor when switching to plan view
            setTimeout(() => this.planEditor.focus(), 100);
            document.body.classList.add('zen-mode'); // Add zen mode for Plan view
        } else {
            this.notesCanvas.style.display = 'grid';
            this.viewSwitchBtn.querySelector('.view-icon').textContent = '⊞';
            this.viewSwitchBtn.querySelector('.view-label').textContent = 'Kalender';
            document.body.classList.remove('zen-mode'); // Remove zen mode
        }

        this.render();

        // Trigger animation cleanup for newly created notes when switching to board/calendar view
        if (this.currentView === 'board' || this.currentView === 'calendar') {
            if (this.newlyCreatedNoteIds.size > 0) {
                console.log('Starting animation timer for', this.newlyCreatedNoteIds.size, 'notes in', this.currentView, 'view');
                // After animation completes (1s), remove IDs from tracking set
                setTimeout(() => {
                    this.newlyCreatedNoteIds.forEach(id => {
                        console.log('Removing animation tracking for note:', id);
                    });
                    this.newlyCreatedNoteIds.clear();
                }, 1000);
            }
        }
    }

    toggleStackView() {
        // Toggle Stack View mode (only in Board view)
        this.stackViewActive = !this.stackViewActive;
        console.log('Stack View:', this.stackViewActive ? 'ON' : 'OFF');

        // Update header view name indicator
        if (window.UI_REDESIGN && window.UI_REDESIGN.updateHeaderViewName) {
            window.UI_REDESIGN.updateHeaderViewName();
        }

        // Re-render to show/hide stack expansion
        this.render();
    }

    switchToView(viewName) {
        // Auto-save current note if leaving plan view
        if (this.currentView === 'plan' && this.currentSavedNoteId) {
            const currentNote = this.savedNotes.find(n => n.id === this.currentSavedNoteId);
            if (currentNote) {
                const plainText = this.getPlainText();
                if (plainText && plainText.trim().length > 0) {
                    currentNote.content = this.planEditor.innerHTML;
                    currentNote.plainText = plainText;
                    currentNote.updatedAt = Date.now();
                    localStorage.setItem('savedPlanNotes', JSON.stringify(this.savedNotes));
                }
            }
        }

        // Set view
        this.currentView = viewName;

        // Hide all views
        this.notesCanvas.style.display = 'none';
        this.calendarView.style.display = 'none';
        this.planView.style.display = 'none';

        // Show current view and update button
        if (this.currentView === 'calendar') {
            this.calendarView.style.display = 'flex';
            this.viewSwitchBtn.querySelector('.view-icon').textContent = '✎';
            this.viewSwitchBtn.querySelector('.view-label').textContent = 'Plan';
            document.body.classList.remove('zen-mode'); // Remove zen mode
        } else if (this.currentView === 'plan') {
            this.planView.style.display = 'flex';
            this.viewSwitchBtn.querySelector('.view-icon').textContent = '⊟';
            this.viewSwitchBtn.querySelector('.view-label').textContent = 'Board';
            setTimeout(() => this.planEditor.focus(), 100);
            document.body.classList.add('zen-mode'); // Add zen mode for Plan view
        } else {
            this.notesCanvas.style.display = 'grid';
            this.viewSwitchBtn.querySelector('.view-icon').textContent = '⊞';
            this.viewSwitchBtn.querySelector('.view-label').textContent = 'Kalender';
            document.body.classList.remove('zen-mode'); // Remove zen mode
        }

        this.render();

        // Trigger animation cleanup for newly created notes when switching to board/calendar view
        if (this.currentView === 'board' || this.currentView === 'calendar') {
            if (this.newlyCreatedNoteIds.size > 0) {
                console.log('Starting animation timer for', this.newlyCreatedNoteIds.size, 'notes in', this.currentView, 'view');
                // After animation completes (1s), remove IDs from tracking set
                setTimeout(() => {
                    this.newlyCreatedNoteIds.forEach(id => {
                        console.log('Removing animation tracking for note:', id);
                    });
                    this.newlyCreatedNoteIds.clear();
                }, 1000);
            }
        }
    }

    assignGroupColors() {
        // Color palette for group indicators
        // Avoiding category colors: #7FDBDA (turquoise), #FFD966 (yellow), #FF69B4 (pink), #B19CD9 (purple)
        const colorPalette = [
            'rgba(100, 180, 255, 0.8)',    // Light blue
            'rgba(150, 220, 150, 0.8)',    // Light green
            'rgba(255, 150, 100, 0.8)',    // Light orange
            'rgba(200, 150, 255, 0.8)',    // Light purple
            'rgba(255, 200, 100, 0.8)',    // Light gold
            'rgba(100, 200, 200, 0.8)',    // Teal
            'rgba(255, 150, 200, 0.8)',    // Light rose
            'rgba(150, 200, 255, 0.8)',    // Sky blue
        ];

        // Find all group stacks that will be unstacked (filters active + type === 'group')
        const groupColors = {};
        let colorIndex = 0;

        if (this.activeFilters.size > 0) {
            this.stacks.forEach(stack => {
                if (stack.type === 'group') {
                    // Check if any notes in this stack pass the filters
                    const stackNotes = stack.noteIds
                        .map(id => this.notes.find(n => n.id === id))
                        .filter(note => note);

                    const filteredStackNotes = stackNotes.filter(note => this.passesFilters(note));

                    if (filteredStackNotes.length > 0) {
                        // Assign color from palette, cycling if needed
                        groupColors[stack.id] = colorPalette[colorIndex % colorPalette.length];
                        colorIndex++;
                    }
                }
            });
        }

        return groupColors;
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

        // Assign colors to unstacked groups
        const groupColors = this.assignGroupColors();

        // Render stacks first (only if they contain filtered notes)
        this.stacks.forEach(stack => {
            const stackNotes = stack.noteIds
                .map(id => this.notes.find(n => n.id === id))
                .filter(n => n && filteredIds.has(n.id)); // Only include filtered notes

            if (stackNotes.length > 0) {
                // Determine if this stack should be expanded:
                // 1. Stack View mode: ALL stacks expanded (groups AND sequential)
                // 2. Filter mode: Only group stacks expanded
                const shouldExpand = this.stackViewActive ||
                                    (this.activeFilters.size > 0 && stack.type === 'group');

                if (shouldExpand) {
                    // Create a wrapper container for this group with sidebar
                    const groupWrapper = document.createElement('div');
                    groupWrapper.className = 'group-row-wrapper';
                    groupWrapper.dataset.stackId = stack.id;

                    // Create sidebar with dashed border and group name
                    const sidebar = document.createElement('div');
                    sidebar.className = 'group-row-sidebar';

                    const label = document.createElement('div');
                    label.className = 'group-row-label';
                    label.textContent = stack.title || 'Gruppe';

                    // Add stack type icon below the label
                    const typeIcon = document.createElement('div');
                    typeIcon.className = 'group-row-type-icon';
                    typeIcon.textContent = stack.type === 'group' ? '+' : '→';
                    typeIcon.title = stack.type === 'group' ? 'Gruppe' : 'Sequenz';

                    sidebar.appendChild(label);
                    sidebar.appendChild(typeIcon);
                    groupWrapper.appendChild(sidebar);

                    // Create inner grid container for the cards
                    const groupGrid = document.createElement('div');
                    groupGrid.className = 'group-row-grid';

                    // Render each note as card in this group's grid
                    stackNotes.forEach(note => {
                        const noteCard = this.createNoteCard(note);
                        groupGrid.appendChild(noteCard);
                        renderedNotes.add(note.id);
                    });

                    groupWrapper.appendChild(groupGrid);
                    this.notesCanvas.appendChild(groupWrapper);
                } else {
                    // Render as stack (when not in Stack View and not a filtered group)
                    const stackContainer = this.createStackContainer(stack, stackNotes);

                    // If filters active OR stack view active, wrap in container for consistent alignment
                    if (this.activeFilters.size > 0 || this.stackViewActive) {
                        const wrapper = document.createElement('div');
                        wrapper.style.paddingLeft = '80px'; // Same as group-row-wrapper
                        wrapper.appendChild(stackContainer);
                        this.notesCanvas.appendChild(wrapper);
                    } else {
                        this.notesCanvas.appendChild(stackContainer);
                    }

                    stackNotes.forEach(note => renderedNotes.add(note.id));
                }
            }
        });

        // Render individual notes (not in stacks, and filtered)
        const individualNotes = filteredNotes.filter(note => !renderedNotes.has(note.id));

        if (individualNotes.length > 0) {
            // If filters OR stack view active, wrap ungrouped notes in invisible group-row for consistent alignment
            if (this.activeFilters.size > 0 || this.stackViewActive) {
                const groupWrapper = document.createElement('div');
                groupWrapper.className = 'group-row-wrapper';

                // Create invisible sidebar (no label, just spacing)
                const sidebar = document.createElement('div');
                sidebar.className = 'group-row-sidebar group-row-sidebar-empty';
                groupWrapper.appendChild(sidebar);

                // Create inner grid container
                const groupGrid = document.createElement('div');
                groupGrid.className = 'group-row-grid';

                individualNotes.forEach(note => {
                    const noteCard = this.createNoteCard(note);
                    groupGrid.appendChild(noteCard);
                });

                groupWrapper.appendChild(groupGrid);
                this.notesCanvas.appendChild(groupWrapper);
            } else {
                // No filters: render normally
                individualNotes.forEach(note => {
                    const noteCard = this.createNoteCard(note);
                    this.notesCanvas.appendChild(noteCard);
                });
            }
        }

    }

    renderKanban() {
        // Update time statistics and work sidebar
        this.updateTimeStats();
        this.updateWorkSidebar();

        // Update collapsed state for unassigned column
        this.updateUnassignedColumnState();

        // Get filtered notes (excluding day filters for Kanban)
        const filteredNotes = this.getFilteredNotesForKanban();
        const filteredIds = new Set(filteredNotes.map(n => n.id));

        // Assign colors to unstacked groups
        const groupColors = this.assignGroupColors();

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
                    // If filters are active AND stack is a group type, render notes individually
                    if (this.activeFilters.size > 0 && stack.type === 'group') {
                        // Render each note separately when filters are active for group stacks
                        stackNotes.forEach(note => {
                            const noteCard = this.createNoteCard(note, null, 1, null, null, true); // isKanban=true
                            // Mark card as part of unstacked group for visual connection
                            noteCard.dataset.unstackedGroup = stack.id;
                            // Apply unique color to this group
                            if (groupColors[stack.id]) {
                                noteCard.style.borderLeft = `12px solid ${groupColors[stack.id]}`;
                            }
                            columnBody.appendChild(noteCard);
                            renderedNotes.add(note.id);
                        });
                    } else {
                        // Render stack container (normal behavior for sequential or no filters)
                        const stackContainer = this.createKanbanStackContainer(stack, stackNotes);
                        columnBody.appendChild(stackContainer);
                        stackNotes.forEach(note => renderedNotes.add(note.id));
                    }
                }
            });

            // Render individual notes (not in stacks)
            dayNotes.forEach(note => {
                if (!renderedNotes.has(note.id)) {
                    const noteCard = this.createNoteCard(note, null, 1, null, null, true); // Pass isKanban=true
                    columnBody.appendChild(noteCard);
                }
            });
        });

    }

    // Calendar View Functions

    renderCalendar() {
        // Update time statistics
        this.updateTimeStats();
        this.updateWorkSidebar();

        // Update month title
        const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        this.calendarMonthTitle.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        // Generate calendar grid
        this.generateCalendarGrid();

        // Render backlog (notes without dueDate)
        this.renderBacklog();

        // Render tasks in calendar cells
        this.renderCalendarTasks();
    }

    generateCalendarGrid() {
        // Clear existing cells
        this.calendarGrid.innerHTML = '';

        // Get first day of month (0 = Sunday, 1 = Monday, etc.)
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        let firstDayOfWeek = firstDay.getDay();
        // Convert Sunday (0) to 7, so Monday is 1
        firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;

        // Get number of days in month
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        // Get days from previous month to fill first week
        const daysFromPrevMonth = firstDayOfWeek - 1;
        const prevMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
        const prevMonthYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
        const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

        // Calculate total cells needed (must be multiple of 7)
        const totalCells = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7;

        // Generate cells
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';

            let day, month, year, isOtherMonth = false;

            if (i < daysFromPrevMonth) {
                // Previous month
                day = daysInPrevMonth - daysFromPrevMonth + i + 1;
                month = prevMonth;
                year = prevMonthYear;
                isOtherMonth = true;
            } else if (i < daysFromPrevMonth + daysInMonth) {
                // Current month
                day = i - daysFromPrevMonth + 1;
                month = this.currentMonth;
                year = this.currentYear;
            } else {
                // Next month
                day = i - daysFromPrevMonth - daysInMonth + 1;
                month = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
                year = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
                isOtherMonth = true;
            }

            // Create ISO date string (YYYY-MM-DD)
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            cell.dataset.date = dateStr;

            // Check if today
            const today = new Date();
            const isToday = day === today.getDate() &&
                           month === today.getMonth() &&
                           year === today.getFullYear();

            // Check if past
            const cellDate = new Date(year, month, day);
            const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            // Apply classes
            if (isToday) cell.classList.add('today');
            if (isPast && !isToday) cell.classList.add('past');
            if (isOtherMonth) cell.classList.add('other-month');

            // Date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'calendar-cell-date';
            dateHeader.textContent = day;
            cell.appendChild(dateHeader);

            // Tasks container
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'calendar-cell-tasks';
            cell.appendChild(tasksContainer);

            // Add drag & drop listeners
            cell.addEventListener('dragover', (e) => this.handleCalendarDragOver(e));
            cell.addEventListener('dragenter', (e) => this.handleCalendarDragEnter(e, dateStr));
            cell.addEventListener('dragleave', (e) => this.handleCalendarDragLeave(e));
            cell.addEventListener('drop', (e) => this.handleCalendarDrop(e, dateStr));

            this.calendarGrid.appendChild(cell);
        }
    }

    renderBacklog() {
        // Clear backlog
        this.calendarBacklogBody.innerHTML = '';

        // Get notes without dueDate
        const backlogNotes = this.notes.filter(note => !note.dueDate);

        // Update count and time
        this.backlogCount.textContent = backlogNotes.length;
        const totalTime = backlogNotes.reduce((sum, note) => sum + (note.timeMinutes || 0), 0);
        this.backlogTime.textContent = totalTime > 0 ? `${totalTime}m` : '0m';

        // Render notes (isKanban=true prevents stacking, isCalendar=true for minimal display)
        backlogNotes.forEach(note => {
            const noteCard = this.createNoteCard(note, null, 1, null, null, true, true);
            this.calendarBacklogBody.appendChild(noteCard);
        });

        // Add drag & drop to backlog body
        if (!this.calendarBacklogBody._calendarListenersAdded) {
            this.calendarBacklogBody.addEventListener('dragover', (e) => this.handleCalendarDragOver(e));
            this.calendarBacklogBody.addEventListener('dragenter', (e) => this.handleCalendarDragEnter(e, null));
            this.calendarBacklogBody.addEventListener('dragleave', (e) => this.handleCalendarDragLeave(e));
            this.calendarBacklogBody.addEventListener('drop', (e) => this.handleCalendarDrop(e, null));
            this.calendarBacklogBody._calendarListenersAdded = true;
        }
    }

    renderCalendarTasks() {
        // Get all calendar cells
        const cells = this.calendarGrid.querySelectorAll('.calendar-cell');

        cells.forEach(cell => {
            const dateStr = cell.dataset.date;
            const tasksContainer = cell.querySelector('.calendar-cell-tasks');

            // Get notes for this date
            const dayNotes = this.notes.filter(note => note.dueDate === dateStr);

            // Render notes (isKanban=true prevents stacking, isCalendar=true for minimal display)
            dayNotes.forEach(note => {
                const noteCard = this.createNoteCard(note, null, 1, null, null, true, true);
                tasksContainer.appendChild(noteCard);
            });
        });
    }

    navigateCalendar(direction) {
        // direction: -1 for prev, +1 for next
        this.currentMonth += direction;

        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }

        this.renderCalendar();
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.renderCalendar();
    }

    // Calendar Drag & Drop Handlers

    handleCalendarDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleCalendarDragEnter(e, dateStr) {
        e.preventDefault();
        const target = e.currentTarget;
        if (target.classList.contains('calendar-cell') || target.classList.contains('calendar-backlog-body')) {
            target.classList.add('drag-over');
        }
    }

    handleCalendarDragLeave(e) {
        const target = e.currentTarget;
        if (target.classList.contains('calendar-cell') || target.classList.contains('calendar-backlog-body')) {
            // Only remove if actually leaving the element
            if (!target.contains(e.relatedTarget)) {
                target.classList.remove('drag-over');
            }
        }
    }

    handleCalendarDrop(e, dateStr) {
        e.preventDefault();
        const target = e.currentTarget;

        // Remove drag-over class from all cells and backlog
        const cells = this.calendarGrid.querySelectorAll('.calendar-cell');
        cells.forEach(cell => cell.classList.remove('drag-over'));
        this.calendarBacklogBody.classList.remove('drag-over');

        // Get dragged note ID
        const noteId = parseFloat(e.dataTransfer.getData('text/plain'));
        console.log('Calendar Drop - noteId:', noteId, 'dateStr:', dateStr);

        const note = this.notes.find(n => n.id === noteId);

        if (!note) {
            console.log('Note not found!');
            return;
        }

        console.log('Moving note from', note.dueDate, 'to', dateStr);

        // Update dueDate (null for backlog, ISO string for calendar cell)
        note.dueDate = dateStr;

        // Remove old assignedDay field (migration)
        delete note.assignedDay;

        this.saveNotes();
        this.renderCalendar();
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
            const categoryFilters = ['category-k', 'category-h', 'category-p', 'category-u'];
            const activeCategoryFilters = categoryFilters.filter(f => this.activeFilters.has(f));

            if (activeCategoryFilters.length > 0) {
                const matchesCategory = activeCategoryFilters.some(filter => {
                    const cat = filter.split('-')[1];
                    return note.category === cat;
                });

                if (!matchesCategory) return false;
            }

            // Check class filters (for --u category)
            const classFilters = ['class-2a', 'class-2b', 'class-2c', 'class-3a', 'class-3b', 'class-5'];
            const activeClassFilters = classFilters.filter(f => this.activeFilters.has(f));

            if (activeClassFilters.length > 0) {
                const matchesClass = activeClassFilters.some(filter => {
                    const cls = filter.split('-')[1];
                    return note.category === 'u' && note.uClass === cls;
                });

                if (!matchesClass) return false;
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

            // Check priority filters
            const priorityFilters = ['priority-1', 'priority-2', 'priority-3'];
            const activePriorityFilters = priorityFilters.filter(f => this.activeFilters.has(f));

            if (activePriorityFilters.length > 0) {
                const matchesPriority = activePriorityFilters.some(filter => {
                    if (filter === 'priority-1') return note.priority === '!';
                    if (filter === 'priority-2') return note.priority === '!!';
                    if (filter === 'priority-3') return note.priority === '!!!';
                    return false;
                });

                if (!matchesPriority) return false;
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
            // Use new task creator modal for editing
            if (window.TASK_CREATOR && window.TASK_CREATOR.openModalForEdit) {
                window.TASK_CREATOR.openModalForEdit(stack.id, 'stack');
            } else {
                this.openStackModal(stack.id); // Fallback to old modal
            }
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
            u: 0,
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
            } else if (note.category === 'u') {
                stats.u += time;
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

        if (stats.u > 0) {
            html += `<div class="time-stat" data-category="u"><span class="time-stat-label">Unterricht:</span><span class="time-stat-value">${stats.u}m</span></div>`;
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
                // Use new task creator modal for editing
                if (window.TASK_CREATOR && window.TASK_CREATOR.openModalForEdit) {
                    window.TASK_CREATOR.openModalForEdit(stack.id, 'stack');
                } else {
                    this.openStackModal(stack.id); // Fallback to old modal
                }
            }
        });

        // Add badge showing number of cards and type
        const badge = document.createElement('div');
        badge.className = 'stack-badge';
        const typeIcon = stack.type === 'sequential' ? '→' : '+';
        badge.textContent = `${typeIcon} ${stackNotes.length} cards`;
        container.appendChild(badge);

        // Calculate total time for stack
        // For both sequential and group: count all cards (total work required)
        const totalTime = stackNotes.reduce((sum, note) => sum + (note.timeMinutes || 0), 0);

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

    createNoteCard(note, stackIndex = null, totalInStack = 1, stackTotalTime = null, stackTitle = null, isKanban = false, isCalendar = false) {
        const card = document.createElement('div');
        card.className = 'note-card';

        // Calendar view: minimal display
        if (isCalendar) {
            card.classList.add('note-card-calendar');
            card.dataset.noteId = note.id;

            if (note.category) {
                card.dataset.category = note.category;
            }

            // Make draggable
            card.draggable = true;
            card.addEventListener('dragstart', (e) => this.handleDragStart(e, note.id));
            card.addEventListener('dragend', (e) => this.handleDragEnd(e));

            // Only content, no buttons
            const content = document.createElement('div');
            content.className = 'note-content';
            content.textContent = note.content;
            card.appendChild(content);

            return card;
        }

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

        // Add pulse animation for newly created notes
        if (this.newlyCreatedNoteIds.has(note.id)) {
            card.classList.add('pulse-animation');
            console.log('Adding pulse animation to note:', note.id);
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

        // In Kanban view, individual cards should not be droppable (only columns are)
        if (!isKanban) {
            card.addEventListener('dragover', (e) => this.handleDragOver(e));
            card.addEventListener('dragenter', (e) => this.handleDragEnter(e, note.id));
            card.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            card.addEventListener('drop', (e) => this.handleDrop(e, note.id));
        }

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

        // Priority indicator (between left and center)
        if (note.priority) {
            const priorityDisplay = document.createElement('span');
            priorityDisplay.className = 'note-priority';
            priorityDisplay.textContent = note.priority;
            leftActions.appendChild(priorityDisplay);
        }

        // Class badge for --u category
        if (note.category === 'u' && note.uClass) {
            const classBadge = document.createElement('span');
            classBadge.className = 'note-class-badge';
            classBadge.textContent = note.uClass;
            leftActions.appendChild(classBadge);
        }

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

        // Right side (unstack + complete + edit menu)
        const rightActions = document.createElement('div');
        rightActions.className = 'note-actions-right';

        // Unstack button (only if card is in a stack)
        if (note.stackId) {
            const unstackBtn = document.createElement('button');
            unstackBtn.className = 'note-unstack';
            unstackBtn.innerHTML = '&#8690;'; // ⇢ Arrow
            unstackBtn.title = 'Aus Stack entfernen';
            unstackBtn.draggable = false;
            unstackBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.unstackNote(note.id);
            });
            rightActions.appendChild(unstackBtn);
        }

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

        // Priority indicator
        if (note.priority) {
            const priorityDisplay = document.createElement('span');
            priorityDisplay.className = 'note-priority';
            priorityDisplay.textContent = note.priority;
            leftActions.appendChild(priorityDisplay);
        }

        // Class badge for --u category
        if (note.category === 'u' && note.uClass) {
            const classBadge = document.createElement('span');
            classBadge.className = 'note-class-badge';
            classBadge.textContent = note.uClass;
            leftActions.appendChild(classBadge);
        }

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

        // Note: Reorder/unstack operations currently don't support undo

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

        // Note: Reorder/unstack operations currently don't support undo

        // Swap with next card
        [stack.noteIds[currentIndex], stack.noteIds[currentIndex + 1]] =
        [stack.noteIds[currentIndex + 1], stack.noteIds[currentIndex]];

        this.saveStacks();
        this.openStackModal(this.currentStackId);
    }

    unstackNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note || !note.stackId) return;

        // Note: Reorder/unstack operations currently don't support undo

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

        // Refresh the current view
        if (this.currentStackId) {
            // If called from modal, refresh modal
            if (stack.noteIds.length === 0) {
                this.closeStackModal();
            } else {
                this.openStackModal(stackId);
            }
        } else {
            // If called from board view, re-render board
            this.renderBoard();
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
        note._originalUClass = note.uClass;
        note._originalPriority = note.priority;
        note._originalTime = note.timeMinutes;

        // Build full edit string with category, priority and time tags
        let editText = note.content;
        if (note.timeMinutes) {
            editText += ` ${note.timeMinutes}m`;
        }
        if (note.priority) {
            editText += ` ${note.priority}`;
        }
        if (note.category === 'u' && note.uClass) {
            editText += ` --u${note.uClass}`;
        } else if (note.category) {
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
            note.uClass = note._originalUClass;
            note.priority = note._originalPriority;
            note.timeMinutes = note._originalTime;

            delete note._originalContent;
            delete note._originalCategory;
            delete note._originalUClass;
            delete note._originalPriority;
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

        // Check if content actually changed
        const hasChanged =
            note._originalContent !== undefined &&
            (content !== note._originalContent ||
             note._originalCategory !== note.category ||
             note._originalPriority !== note.priority ||
             note._originalTime !== note.timeMinutes);

        // Note: Edit operations currently don't support undo
        // to keep the undo system focused on create/delete/complete operations

        // Parse content using same logic as addNote
        let category = null;
        let uClass = null;
        const uCategoryMatch = content.match(/--u(2a|2b|2c|3a|3b|5)$/);
        if (uCategoryMatch) {
            category = 'u';
            uClass = uCategoryMatch[1];
            content = content.replace(/\s*--u(2a|2b|2c|3a|3b|5)$/, '').trim();
        } else {
            const categoryMatch = content.match(/--([khp])$/);
            if (categoryMatch) {
                category = categoryMatch[1];
                content = content.replace(/\s*--[khp]$/, '').trim();
            }
        }

        // Then check for priority (e.g., !, !!, !!!)
        let priority = null;
        const priorityMatch = content.match(/\s+(!!!|!!|!)$/);
        if (priorityMatch) {
            priority = priorityMatch[1];
            content = content.replace(/\s+(!!!|!!|!)$/, '').trim();
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
        note.uClass = uClass;
        note.priority = priority;
        note.timeMinutes = timeMinutes;

        // Clean up temporary properties
        delete note._originalContent;
        delete note._originalCategory;
        delete note._originalUClass;
        delete note._originalPriority;
        delete note._originalTime;

        this.saveNotes();

        // Refresh modal
        if (this.currentStackId) {
            this.openStackModal(this.currentStackId);
        }
    }

    // ========== Completed Counter ==========

    loadCompletedCounter() {
        const saved = localStorage.getItem('completedCounter');
        if (saved) {
            const data = JSON.parse(saved);
            this.completedToday = data.completedToday || 0;
            this.lastResetDate = data.lastResetDate || null;
        }
    }

    saveCompletedCounter() {
        const data = {
            completedToday: this.completedToday,
            lastResetDate: this.lastResetDate
        };
        localStorage.setItem('completedCounter', JSON.stringify(data));
    }

    checkAndResetCounter() {
        const today = new Date().toDateString();

        if (this.lastResetDate !== today) {
            // New day, reset counter
            this.completedToday = 0;
            this.lastResetDate = today;
            this.saveCompletedCounter();
        }

        this.updateCompletedCounter();
    }

    updateCompletedCounter() {
        if (this.completedCounterElement) {
            this.completedCounterElement.textContent = `${this.completedToday} heute erledigt`;
        }
    }

    // ========== Undo Functionality ==========

    // Old undo system removed - now using undoStack system with multi-step support

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

    // ========== Plan View ==========

    handleMarkdownAutoFormat() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const currentNode = range.startContainer;

        // Find the block element containing cursor (could be DIV, P, or other block elements)
        let element = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : currentNode;

        // Special case: if we're directly in planEditor (first line, no DIV yet)
        if (element === this.planEditor) {
            // Get the text content from the text node
            const text = currentNode.textContent ? currentNode.textContent.trim() : '';

            // Check if text matches a pattern BEFORE clearing
            // Directly create the final element based on pattern
            if (text === '#') {
                // Clear the editor first (removes the # character)
                this.planEditor.innerHTML = '';

                const h1 = document.createElement('h1');
                h1.innerHTML = '<br>';
                this.planEditor.appendChild(h1);

                const selection = window.getSelection();
                const range = document.createRange();
                range.setStart(h1, 0);
                range.setEnd(h1, 0);
                selection.removeAllRanges();
                selection.addRange(range);

                this.savePlanText();
                return true;
            } else if (text === '##') {
                // Clear the editor first
                this.planEditor.innerHTML = '';

                const h2 = document.createElement('h2');
                h2.innerHTML = '<br>';
                this.planEditor.appendChild(h2);

                const selection = window.getSelection();
                const range = document.createRange();
                range.setStart(h2, 0);
                range.setEnd(h2, 0);
                selection.removeAllRanges();
                selection.addRange(range);

                this.savePlanText();
                return true;
            } else if (text === '###') {
                // Clear the editor first
                this.planEditor.innerHTML = '';

                const h3 = document.createElement('h3');
                h3.innerHTML = '<br>';
                this.planEditor.appendChild(h3);

                const selection = window.getSelection();
                const range = document.createRange();
                range.setStart(h3, 0);
                range.setEnd(h3, 0);
                selection.removeAllRanges();
                selection.addRange(range);

                this.savePlanText();
                return true;
            } else if (text === '>') {
                // Clear the editor first
                this.planEditor.innerHTML = '';

                const blockquote = document.createElement('blockquote');
                blockquote.innerHTML = '<br>';
                this.planEditor.appendChild(blockquote);

                const selection = window.getSelection();
                const range = document.createRange();
                range.setStart(blockquote, 0);
                range.setEnd(blockquote, 0);
                selection.removeAllRanges();
                selection.addRange(range);

                this.savePlanText();
                return true;
            } else if (/^\d+\.$/.test(text)) {
                // Clear the editor first
                this.planEditor.innerHTML = '';

                const ol = document.createElement('ol');
                const li = document.createElement('li');
                li.innerHTML = '<br>';
                ol.appendChild(li);
                this.planEditor.appendChild(ol);

                const selection = window.getSelection();
                const range = document.createRange();
                range.setStart(li, 0);
                range.setEnd(li, 0);
                selection.removeAllRanges();
                selection.addRange(range);

                this.savePlanText();
                return true;
            }

            // No match - don't clear anything, just return false
            return false;
        }

        // Walk up the DOM tree to find a block-level element
        while (element && element !== this.planEditor) {
            const tag = element.tagName;
            if (tag === 'DIV' || tag === 'P' || tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'BLOCKQUOTE') {
                break;
            }
            element = element.parentElement;
        }

        if (!element || element === this.planEditor) return false;

        // Only convert if we're in a DIV (not already in a heading or blockquote)
        if (element.tagName !== 'DIV') return false;

        // Get text BEFORE space will be inserted (trim to handle any extra spaces)
        const text = element.textContent.trim();

        // Check for heading patterns
        if (text === '#') {
            this.convertToHeading(element, 'h1');
            return true;
        } else if (text === '##') {
            this.convertToHeading(element, 'h2');
            return true;
        } else if (text === '###') {
            this.convertToHeading(element, 'h3');
            return true;
        }

        // Check for blockquote
        if (text === '>') {
            this.convertToBlockquote(element);
            return true;
        }

        // Check for numbered list (1., 2., etc.)
        if (/^\d+\.$/.test(text)) {
            this.convertToNumberedList(element);
            return true;
        }

        return false;
    }

    handleBlockExit() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const currentNode = range.startContainer;

        // Find the block element
        let element = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : currentNode;
        while (element && element !== this.planEditor) {
            const tag = element.tagName;

            // Check if we're in a blockquote or heading
            if (tag === 'BLOCKQUOTE' || tag === 'H1' || tag === 'H2' || tag === 'H3') {
                // Check if element is empty or only has whitespace
                const text = element.textContent.trim();

                if (text === '' || text === '\u200B') {
                    // Create new div after this element
                    const newDiv = document.createElement('div');
                    newDiv.innerHTML = '<br>';
                    element.parentNode.insertBefore(newDiv, element.nextSibling);

                    // Remove the empty blockquote/heading
                    element.remove();

                    // Move cursor to new div
                    const newRange = document.createRange();
                    newRange.setStart(newDiv, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);

                    this.savePlanText();
                    return true;
                }
            }
            element = element.parentElement;
        }

        return false;
    }

    convertToHeading(lineElement, level) {
        // Create heading element
        const heading = document.createElement(level);

        // Add a BR element to make it editable and not collapse
        heading.innerHTML = '<br>';

        // Replace the div with heading
        lineElement.parentNode.replaceChild(heading, lineElement);

        // Place cursor in the heading
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(heading, 0);
        range.setEnd(heading, 0);
        selection.removeAllRanges();
        selection.addRange(range);

        this.savePlanText();
    }

    convertToBlockquote(lineElement) {
        // Create blockquote element
        const blockquote = document.createElement('blockquote');

        // Add a BR element to make it editable and not collapse
        blockquote.innerHTML = '<br>';

        // Replace the div with blockquote
        lineElement.parentNode.replaceChild(blockquote, lineElement);

        // Place cursor in the blockquote
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(blockquote, 0);
        range.setEnd(blockquote, 0);
        selection.removeAllRanges();
        selection.addRange(range);

        this.savePlanText();
    }

    convertToNumberedList(lineElement) {
        // Create ordered list structure manually
        const ol = document.createElement('ol');
        const li = document.createElement('li');
        li.innerHTML = '<br>'; // BR element instead of space
        ol.appendChild(li);

        // Replace the div with ol
        lineElement.parentNode.replaceChild(ol, lineElement);

        // Place cursor in the li
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(li, 0);
        range.setEnd(li, 0);
        selection.removeAllRanges();
        selection.addRange(range);

        this.savePlanText();
    }

    handleDividerCreation() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const currentNode = range.startContainer;

        // Find the div containing current line
        let lineElement = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : currentNode;
        while (lineElement && lineElement.tagName !== 'DIV' && lineElement !== this.planEditor) {
            lineElement = lineElement.parentElement;
        }

        if (!lineElement || lineElement.tagName !== 'DIV') return false;

        const lineText = lineElement.textContent.trim();

        // Check for divider pattern (---)
        if (lineText === '---' || lineText === '—') {
            // Create hr element
            const hr = document.createElement('hr');

            // Create new empty div for next line
            const newDiv = document.createElement('div');
            newDiv.innerHTML = '<br>';

            // Replace current line with hr
            lineElement.parentNode.replaceChild(hr, lineElement);

            // Insert new div after hr
            hr.parentNode.insertBefore(newDiv, hr.nextSibling);

            // Move cursor to new line
            const newRange = document.createRange();
            newRange.setStart(newDiv, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            this.savePlanText();
            return true;
        }

        return false;
    }

    handleTableCreation() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const currentNode = range.startContainer;

        // Find the div containing current line
        let lineElement = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : currentNode;
        while (lineElement && lineElement.tagName !== 'DIV' && lineElement !== this.planEditor) {
            lineElement = lineElement.parentElement;
        }

        if (!lineElement || lineElement.tagName !== 'DIV') return false;

        // Check if current line is empty (user pressed Enter on empty line after table)
        const lineText = lineElement.textContent.trim();
        if (lineText !== '') return false;

        console.log('Empty line detected, checking for table...');

        // Look backwards to find table markdown lines
        const tableLines = [];
        let currentElement = lineElement.previousElementSibling;

        // Collect all consecutive lines that look like table rows (start with |)
        while (currentElement && currentElement.tagName === 'DIV') {
            const text = currentElement.textContent.trim();
            if (text.startsWith('|') && text.endsWith('|')) {
                tableLines.unshift(text); // Add to beginning
                currentElement = currentElement.previousElementSibling;
            } else {
                break;
            }
        }

        console.log('Found table lines:', tableLines);

        // Need at least 1 line (just the header)
        if (tableLines.length < 1) return false;

        // First line is header
        const headers = this.parseTableRow(tableLines[0]);
        console.log('Headers:', headers);

        // Remaining lines are data rows, or create one empty row if only header exists
        let rows;
        if (tableLines.length > 1) {
            rows = tableLines.slice(1).map(line => this.parseTableRow(line));
        } else {
            // Create one empty row with same number of columns as headers
            rows = [headers.map(() => '')];
        }
        console.log('Rows:', rows);

        // Create HTML table (returns wrapper with table + action buttons)
        const tableWrapper = this.createHTMLTable(headers, rows);

        // Find first table line element to replace
        let firstTableElement = lineElement;
        for (let i = 0; i < tableLines.length; i++) {
            firstTableElement = firstTableElement.previousElementSibling;
        }

        // Remove all table markdown lines
        let elementToRemove = firstTableElement;
        for (let i = 0; i < tableLines.length; i++) {
            const next = elementToRemove.nextElementSibling;
            elementToRemove.remove();
            elementToRemove = next;
        }

        // Replace empty line with table wrapper
        lineElement.parentNode.replaceChild(tableWrapper, lineElement);

        // Create new div after table for continued editing
        const newDiv = document.createElement('div');
        newDiv.innerHTML = '<br>';
        tableWrapper.parentNode.insertBefore(newDiv, tableWrapper.nextSibling);

        // Move cursor to new div
        const newRange = document.createRange();
        newRange.setStart(newDiv, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        this.savePlanText();
        return true;
    }

    parseTableRow(line) {
        // Remove leading and trailing |
        line = line.trim();
        if (line.startsWith('|')) line = line.substring(1);
        if (line.endsWith('|')) line = line.substring(0, line.length - 1);

        // Split by | and trim each cell
        return line.split('|').map(cell => cell.trim());
    }

    createHTMLTable(headers, rows) {
        // Create wrapper div for table + actions
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';

        const table = document.createElement('table');
        table.className = 'plan-table';
        table.contentEditable = 'false'; // Table itself not editable, only cells

        // Track last focused cell for move operations
        table._lastFocusedCell = null;

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.contentEditable = 'true';
            th.textContent = headerText;
            // Track focus for move operations
            th.addEventListener('focus', () => {
                table._lastFocusedCell = th;
                this.setCurrentFocusedTable(table);
            });
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        rows.forEach(rowData => {
            const tr = document.createElement('tr');
            rowData.forEach(cellText => {
                const td = document.createElement('td');
                td.contentEditable = 'true';
                td.textContent = cellText;
                // Track focus for move operations
                td.addEventListener('focus', () => {
                    table._lastFocusedCell = td;
                    this.setCurrentFocusedTable(table);
                });
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        // Add table to wrapper
        wrapper.appendChild(table);

        // No longer creating per-table buttons - using global buttons instead

        return wrapper;
    }

    addTableRow(table) {
        const tbody = table.querySelector('tbody');
        const columnCount = table.querySelector('thead tr').children.length;

        const newRow = document.createElement('tr');
        for (let i = 0; i < columnCount; i++) {
            const td = document.createElement('td');
            td.contentEditable = 'true';
            td.textContent = '';
            // Track focus for move operations
            td.addEventListener('focus', () => {
                table._lastFocusedCell = td;
                this.setCurrentFocusedTable(table);
            });
            newRow.appendChild(td);
        }

        tbody.appendChild(newRow);
        this.savePlanText();

        // Focus first cell of new row
        newRow.firstElementChild.focus();
    }

    addTableColumn(table) {
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        // Add header cell
        const headerRow = thead.querySelector('tr');
        const newTh = document.createElement('th');
        newTh.contentEditable = 'true';
        newTh.textContent = 'Column';
        // Track focus for move operations
        newTh.addEventListener('focus', () => {
            table._lastFocusedCell = newTh;
            this.setCurrentFocusedTable(table);
        });
        headerRow.appendChild(newTh);

        // Add cell to each body row
        const bodyRows = tbody.querySelectorAll('tr');
        bodyRows.forEach(row => {
            const newTd = document.createElement('td');
            newTd.contentEditable = 'true';
            newTd.textContent = '';
            // Track focus for move operations
            newTd.addEventListener('focus', () => {
                table._lastFocusedCell = newTd;
                this.setCurrentFocusedTable(table);
            });
            row.appendChild(newTd);
        });

        this.savePlanText();

        // Focus new header cell
        newTh.focus();
    }

    deleteTable(wrapper) {
        if (confirm('Tabelle wirklich löschen?')) {
            wrapper.remove();
            this.currentFocusedTable = null;
            this.updateTableButtonsState();
            this.savePlanText();
        }
    }

    setCurrentFocusedTable(table) {
        this.currentFocusedTable = table;
        this.updateTableButtonsState();
    }

    updateTableButtonsState() {
        const isTableFocused = this.currentFocusedTable !== null;

        this.tableAddRowBtn.disabled = !isTableFocused;
        this.tableAddColBtn.disabled = !isTableFocused;
        this.tableMoveRowUpBtn.disabled = !isTableFocused;
        this.tableMoveRowDownBtn.disabled = !isTableFocused;
        this.tableMoveColLeftBtn.disabled = !isTableFocused;
        this.tableMoveColRightBtn.disabled = !isTableFocused;
        this.tableDeleteBtn.disabled = !isTableFocused;
    }

    moveTableRow(table, direction) {
        // Use last focused cell (stored on table element)
        const focusedCell = table._lastFocusedCell;
        if (!focusedCell || (focusedCell.tagName !== 'TD' && focusedCell.tagName !== 'TH')) {
            alert('Bitte zuerst eine Zelle fokussieren');
            return;
        }

        // Find the row containing the focused cell
        let currentRow = focusedCell.parentElement;
        if (!currentRow || currentRow.tagName !== 'TR') return;

        // Check if we're in header (can't move header row)
        const isHeader = focusedCell.tagName === 'TH';
        if (isHeader) {
            alert('Header-Zeile kann nicht verschoben werden');
            return;
        }

        // Get sibling row
        const targetRow = direction === 'up' ? currentRow.previousElementSibling : currentRow.nextElementSibling;
        if (!targetRow) {
            alert(direction === 'up' ? 'Bereits erste Zeile' : 'Bereits letzte Zeile');
            return;
        }

        // Swap rows
        const tbody = currentRow.parentElement;
        if (direction === 'up') {
            tbody.insertBefore(currentRow, targetRow);
        } else {
            tbody.insertBefore(targetRow, currentRow);
        }

        this.savePlanText();

        // Re-focus the original cell
        setTimeout(() => focusedCell.focus(), 10);
    }

    moveTableColumn(table, direction) {
        // Use last focused cell (stored on table element)
        const focusedCell = table._lastFocusedCell;
        if (!focusedCell || (focusedCell.tagName !== 'TD' && focusedCell.tagName !== 'TH')) {
            alert('Bitte zuerst eine Zelle fokussieren');
            return;
        }

        // Find column index
        const currentRow = focusedCell.parentElement;
        const cells = Array.from(currentRow.children);
        const columnIndex = cells.indexOf(focusedCell);

        if (columnIndex === -1) return;

        // Check boundaries
        const targetIndex = direction === 'left' ? columnIndex - 1 : columnIndex + 1;
        if (targetIndex < 0) {
            alert('Bereits erste Spalte');
            return;
        }
        if (targetIndex >= cells.length) {
            alert('Bereits letzte Spalte');
            return;
        }

        // Move column in header
        const thead = table.querySelector('thead');
        const headerRow = thead.querySelector('tr');
        const headerCells = Array.from(headerRow.children);
        const headerCell = headerCells[columnIndex];
        const targetHeaderCell = headerCells[targetIndex];

        if (direction === 'left') {
            headerRow.insertBefore(headerCell, targetHeaderCell);
        } else {
            headerRow.insertBefore(targetHeaderCell, headerCell);
        }

        // Move column in all body rows
        const tbody = table.querySelector('tbody');
        const bodyRows = tbody.querySelectorAll('tr');
        bodyRows.forEach(row => {
            const rowCells = Array.from(row.children);
            const cell = rowCells[columnIndex];
            const targetCell = rowCells[targetIndex];

            if (direction === 'left') {
                row.insertBefore(cell, targetCell);
            } else {
                row.insertBefore(targetCell, cell);
            }
        });

        this.savePlanText();

        // Re-focus the original cell
        setTimeout(() => focusedCell.focus(), 10);
    }

    handleTableTabNavigation(shiftKey) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;

        const range = selection.getRangeAt(0);
        let currentCell = range.startContainer;

        // Find the current table cell
        while (currentCell && currentCell.tagName !== 'TD' && currentCell.tagName !== 'TH' && currentCell !== this.planEditor) {
            currentCell = currentCell.parentElement;
        }

        if (!currentCell || (currentCell.tagName !== 'TD' && currentCell.tagName !== 'TH')) return false;

        // Find the table
        let table = currentCell;
        while (table && table.tagName !== 'TABLE') {
            table = table.parentElement;
        }

        if (!table) return false;

        // Get all cells in the table
        const allCells = Array.from(table.querySelectorAll('th, td'));
        const currentIndex = allCells.indexOf(currentCell);

        if (currentIndex === -1) return false;

        // Determine next cell
        let nextIndex;
        if (shiftKey) {
            // Shift+Tab: Go backwards
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
                // Exit table, move to element before table
                const prevElement = table.previousElementSibling;
                if (prevElement) {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(prevElement);
                    newRange.collapse(false); // Move to end
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
                return true;
            }
        } else {
            // Tab: Go forwards
            nextIndex = currentIndex + 1;
            if (nextIndex >= allCells.length) {
                // Exit table, move to element after table
                const nextElement = table.nextElementSibling;
                if (nextElement) {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(nextElement);
                    newRange.collapse(true); // Move to start
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
                return true;
            }
        }

        // Move to next cell
        const nextCell = allCells[nextIndex];
        const newRange = document.createRange();
        newRange.selectNodeContents(nextCell);
        newRange.collapse(true); // Move to start of cell
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Focus the next cell
        nextCell.focus();

        return true;
    }

    handlePlanKeyDown(e) {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        // Tab: Navigate between table cells
        if (e.key === 'Tab' && !cmdOrCtrl) {
            const handled = this.handleTableTabNavigation(e.shiftKey);
            if (handled) {
                e.preventDefault();
                return;
            }
        }

        // Space: Check for Markdown patterns BEFORE space is inserted
        if (e.key === ' ' && !cmdOrCtrl && !e.shiftKey) {
            const handled = this.handleMarkdownAutoFormat();
            if (handled) {
                e.preventDefault();
                return;
            }
        }

        // Enter: Check for empty blockquote/heading exit OR divider (---) or > task syntax
        if (e.key === 'Enter' && !cmdOrCtrl && !e.shiftKey) {
            // First check if we're in an empty blockquote or heading - if so, exit it
            const exitHandled = this.handleBlockExit();
            if (exitHandled) {
                e.preventDefault();
                return;
            }

            // Then check for divider (---)
            // Check for horizontal divider first
            const dividerHandled = this.handleDividerCreation();
            if (dividerHandled) {
                e.preventDefault();
                return;
            }

            // Check for table creation
            const tableHandled = this.handleTableCreation();
            if (tableHandled) {
                e.preventDefault();
                return;
            }

            // OLD > task syntax removed - now using > for blockquotes
        }

        // Bold: Cmd/Ctrl + B
        if (cmdOrCtrl && e.key === 'b') {
            e.preventDefault();
            document.execCommand('bold', false, null);
            return;
        }

        // Italic: Cmd/Ctrl + I
        if (cmdOrCtrl && e.key === 'i') {
            e.preventDefault();
            document.execCommand('italic', false, null);
            return;
        }

        // Bullet list: Cmd/Ctrl + Shift + 8
        if (cmdOrCtrl && e.shiftKey && e.key === '8') {
            e.preventDefault();
            document.execCommand('insertUnorderedList', false, null);
            return;
        }

        // Numbered list: Cmd/Ctrl + Shift + 7
        if (cmdOrCtrl && e.shiftKey && e.key === '7') {
            e.preventDefault();
            document.execCommand('insertOrderedList', false, null);
            return;
        }

        // Checkbox: Cmd/Ctrl + Shift + C
        if (cmdOrCtrl && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
            this.insertCheckbox();
            return;
        }

        // Stack creation: Cmd/Ctrl + Enter
        if (cmdOrCtrl && e.key === 'Enter') {
            e.preventDefault();
            this.triggerStackCreation();
            return;
        }

        // Undo/Redo: Cmd/Ctrl + Z/Shift+Z
        // In Plan View, we want native contenteditable undo/redo for text
        // So we DON'T prevent default here - let browser handle it
        if (cmdOrCtrl && e.key === 'z') {
            // Let browser's native undo work for text editing
            // Don't call this.undo() which is for task management
            return;
        }
    }

    triggerStackCreation() {
        // Check if we're in a stack block context
        const text = this.getPlainText();
        const hasStackBlock = /(seq|group):\s*[^\n\r]+[\n\r]+((?:\s*-\s*[^\n\r]+[\n\r]*)+)$/i.test(text);

        if (hasStackBlock) {
            // Add the "/" trigger at the end
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(this.planEditor);
            range.collapse(false); // Move to end

            // Insert "/" on a new line
            const div = document.createElement('div');
            div.textContent = '/';
            range.insertNode(div);
            range.setStartAfter(div);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);

            // Immediately trigger parsing (no debounce)
            this.handlePlanInput();
        }
    }

    // Undo functionality
    addToUndoStack(action) {
        console.log('Adding to undo stack:', action);

        // Add timestamp and description
        action.timestamp = Date.now();
        action.description = this.getUndoDescription(action);

        this.undoStack.push(action);
        // Limit undo stack size
        if (this.undoStack.length > this.maxUndoStack) {
            this.undoStack.shift();
        }
        console.log('Undo stack now has', this.undoStack.length, 'items');

        // Update undo button state
        this.updateUndoButton();
    }

    getUndoDescription(action) {
        switch (action.type) {
            case 'createNote':
                const note = this.notes.find(n => n.id === action.data.noteId);
                const content = note ? note.content.substring(0, 30) : 'Note';
                return `Note erstellt: ${content}${note && note.content.length > 30 ? '...' : ''}`;

            case 'createStack':
                return `Stack erstellt (${action.data.noteIds.length} Tasks)`;

            case 'deleteNote':
                const deletedContent = action.data.note.content.substring(0, 30);
                return `Note gelöscht: ${deletedContent}${action.data.note.content.length > 30 ? '...' : ''}`;

            case 'completeNote':
                const completedNote = this.notes.find(n => n.id === action.data.noteId);
                const completedContent = completedNote ? completedNote.content.substring(0, 30) : 'Note';
                return `Note abgeschlossen: ${completedContent}${completedNote && completedNote.content.length > 30 ? '...' : ''}`;

            default:
                return 'Aktion';
        }
    }

    undo() {
        console.log('Undo called, stack length:', this.undoStack.length);
        if (this.undoStack.length === 0) {
            console.log('Nothing to undo');
            return;
        }

        const action = this.undoStack.pop();
        console.log('Undoing action:', action);

        switch (action.type) {
            case 'createNote':
                // Remove the note
                this.notes = this.notes.filter(n => n.id !== action.data.noteId);
                this.saveNotes();
                this.render();
                console.log('Undid note creation');
                break;

            case 'createStack':
                // Remove the stack AND all notes that were created with it
                const stack = this.stacks.find(s => s.id === action.data.stackId);
                if (stack) {
                    // Remove all notes that were part of this stack
                    this.notes = this.notes.filter(n => !action.data.noteIds.includes(n.id));

                    // Remove the stack
                    this.stacks = this.stacks.filter(s => s.id !== action.data.stackId);
                    this.saveNotes();
                    this.saveStacks();
                    this.render();
                    console.log('Undid stack creation - removed stack and', action.data.noteIds.length, 'notes');
                }
                break;

            case 'deleteNote':
                // Restore the note
                this.notes.push(action.data.note);
                this.saveNotes();
                this.render();
                console.log('Undid note deletion');
                break;

            case 'completeNote':
                // Restore the note (it was deleted when completed)
                if (action.data.note) {
                    this.notes.push(action.data.note);
                    // Decrement completed counter
                    if (this.completedToday > 0) {
                        this.completedToday--;
                        this.saveCompletedCounter();
                        this.updateCompletedCounter();
                    }
                    this.saveNotes();
                    this.render();
                    console.log('Undid note completion');
                }
                break;
        }

        // Update task icons in plan mode
        this.updatePlanTaskIcons();

        // Update button state and close dropdown
        this.updateUndoButton();
        this.closeUndoDropdown();
    }

    updateUndoButton() {
        const count = this.undoStack.length;
        this.undoCount.textContent = count;
        this.undoBtn.disabled = count === 0;
    }

    toggleUndoDropdown() {
        if (this.undoStack.length === 0) return;

        const isVisible = this.undoDropdown.style.display === 'block';

        if (isVisible) {
            this.closeUndoDropdown();
        } else {
            this.renderUndoHistory();
            this.undoDropdown.style.display = 'block';
        }
    }

    closeUndoDropdown() {
        this.undoDropdown.style.display = 'none';
    }

    renderUndoHistory() {
        this.undoHistoryList.innerHTML = '';

        if (this.undoStack.length === 0) {
            this.undoHistoryList.innerHTML = '<div style="padding: 12px; text-align: center; color: #666;">Keine Aktionen</div>';
            return;
        }

        // Show stack in reverse order (most recent first)
        const reversedStack = [...this.undoStack].reverse();

        reversedStack.forEach((action, reverseIndex) => {
            const stackIndex = this.undoStack.length - 1 - reverseIndex;
            const item = document.createElement('div');
            item.className = 'undo-history-item';
            item.dataset.index = stackIndex;

            // Get icon based on action type
            let icon = '↶';
            switch (action.type) {
                case 'createNote': icon = '+'; break;
                case 'createStack': icon = '⊞'; break;
                case 'deleteNote': icon = '×'; break;
                case 'completeNote': icon = '○'; break;
            }

            // Format timestamp
            const timeAgo = this.getTimeAgo(action.timestamp);

            item.innerHTML = `
                <span class="undo-history-icon">${icon}</span>
                <span class="undo-history-text">${action.description}</span>
                <span class="undo-history-time">${timeAgo}</span>
            `;

            item.addEventListener('click', () => this.undoMultipleSteps(stackIndex));

            this.undoHistoryList.appendChild(item);
        });
    }

    undoMultipleSteps(targetIndex) {
        // Undo all actions from the end up to and including targetIndex
        const stepsToUndo = this.undoStack.length - targetIndex;

        for (let i = 0; i < stepsToUndo; i++) {
            if (this.undoStack.length > 0) {
                // Call undo without closing dropdown yet
                const action = this.undoStack.pop();

                switch (action.type) {
                    case 'createNote':
                        this.notes = this.notes.filter(n => n.id !== action.data.noteId);
                        break;

                    case 'createStack':
                        const stack = this.stacks.find(s => s.id === action.data.stackId);
                        if (stack) {
                            this.notes = this.notes.filter(n => !action.data.noteIds.includes(n.id));
                            this.stacks = this.stacks.filter(s => s.id !== action.data.stackId);
                        }
                        break;

                    case 'deleteNote':
                        this.notes.push(action.data.note);
                        break;

                    case 'completeNote':
                        if (action.data.note) {
                            this.notes.push(action.data.note);
                            // Decrement completed counter
                            if (this.completedToday > 0) {
                                this.completedToday--;
                            }
                        }
                        break;
                }
            }
        }

        // Save and render once after all undos
        this.saveNotes();
        this.saveStacks();
        this.saveCompletedCounter();
        this.updateCompletedCounter();
        this.render();

        // Update button and close dropdown
        this.updateUndoButton();
        this.closeUndoDropdown();

        console.log(`Undid ${stepsToUndo} steps`);
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'gerade eben';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    }

    insertCheckbox() {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        // Create checkbox HTML
        const span = document.createElement('span');
        span.className = 'task-item';
        span.innerHTML = '<input type="checkbox" class="task-checkbox"> ';

        range.insertNode(span);
        range.collapse(false);

        this.savePlanText();
    }

    getPlainText() {
        // Extract plain text from HTML, preserving structure
        const clone = this.planEditor.cloneNode(true);

        // Replace checkboxes with markdown syntax
        const checkboxes = clone.querySelectorAll('.task-checkbox');
        checkboxes.forEach(cb => {
            const marker = cb.checked ? '[x]' : '[ ]';
            cb.replaceWith(`- ${marker} `);
        });

        // Convert <br> and <div> to newlines before extracting text
        clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
        clone.querySelectorAll('div').forEach(div => {
            const text = div.textContent;
            div.replaceWith('\n' + text);
        });

        return clone.textContent || clone.innerText || '';
    }

    parseAndCreateNote(taskContent) {
        // Parse task content and create note
        // Returns the created note object or null
        let content = taskContent;
        let category = null;
        let uClass = null;
        let timeMinutes = null;
        let priority = null;

        // Extract category - check for --u with class first
        const uCategoryMatch = content.match(/--u(2a|2b|2c|3a|3b|5)/);
        if (uCategoryMatch) {
            category = 'u';
            uClass = uCategoryMatch[1];
            content = content.replace(/--u(2a|2b|2c|3a|3b|5)/, '').trim();
        } else {
            const categoryMatch = content.match(/--([khp])/);
            if (categoryMatch) {
                category = categoryMatch[1];
                content = content.replace(/--[khp]/, '').trim();
            }
        }

        // Extract priority (!, !!, !!!)
        const priorityMatch = content.match(/(!{1,3})/);
        if (priorityMatch) {
            priority = priorityMatch[1];
            content = content.replace(/!{1,3}/, '').trim();
        }

        // Extract time (e.g., "30m")
        const timeMatch = content.match(/(\d+)m/);
        if (timeMatch) {
            timeMinutes = parseInt(timeMatch[1]);
            content = content.replace(/\d+m/, '').trim();
        }

        // Clean up extra whitespace
        content = content.replace(/\s+/g, ' ').trim();

        if (content) {
            // Create the note
            const note = {
                id: Date.now() + Math.random(),
                content: content,
                timestamp: new Date().toISOString(),
                completed: false,
                stackId: null,
                category: category,
                uClass: uClass,
                timeMinutes: timeMinutes,
                focused: false,
                assignedDay: null,
                priority: priority
            };

            this.notes.push(note);
            this.newlyCreatedNoteIds.add(note.id);
            this.saveNotes();
            this.render();

            // Add to undo stack
            this.addToUndoStack({
                type: 'createNote',
                data: {
                    noteId: note.id
                }
            });

            console.log('Task created:', note);
            return note;
        }

        return null;
    }

    createTaskWidgetFromLine(lineElement) {
        // Legacy function - kept for backwards compatibility
        const lineText = lineElement.textContent.trim();

        // Remove > prefix
        const taskContent = lineText.substring(1).trim();

        if (!taskContent) return;

        const note = this.parseAndCreateNote(taskContent);

        if (note) {
            // Replace line with widget
            const widget = this.createPlanTaskWidget(note);
            lineElement.innerHTML = widget;
            this.savePlanText();
        }
    }

    handlePlanInputDebounced() {
        // Clear existing timer
        if (this.planInputDebounceTimer) {
            clearTimeout(this.planInputDebounceTimer);
        }

        // Set new timer - wait 300ms after user stops typing
        this.planInputDebounceTimer = setTimeout(() => {
            this.handlePlanInput();
        }, 300);

        // Always save immediately (don't debounce auto-save)
        this.savePlanText();
    }

    handlePlanInput() {
        // Get plain text for task parsing
        const text = this.getPlainText();

        // NOTE: > prefix parsing moved to Enter key handler (createTaskWidgetFromLine)
        // This prevents creating notes on every keystroke

        // First, parse for stack blocks: seq:/group: with bullet list
        // Example:
        // seq: Mathe Homework
        // - Task 1 30m --u2a
        // - Task 2 45m --u2a
        // /  <- trigger
        // Pattern requires a "/" on its own line to trigger creation
        const stackPattern = /(seq|group):\s*([^\n\r]+)[\n\r]+((?:\s*-\s*[^\n\r]+[\n\r]+)+)\s*\/\s*(?:[\n\r]|$)/gi;
        const stackMatches = [...text.matchAll(stackPattern)];

        if (stackMatches.length > 0) {
            stackMatches.forEach(match => {
                const fullMatch = match[0];
                const stackType = match[1]; // 'seq' or 'group'
                const stackTitle = match[2].trim();
                const bulletLines = match[3];

                // Check if already processed by looking for the [...] confirmation in HTML
                const currentHTML = this.planEditor.innerHTML;
                const escapedTitle = stackTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const checkPattern = new RegExp(`${stackType}:\\s*${escapedTitle}\\s*\\[`, 'i');
                const alreadyProcessed = checkPattern.test(currentHTML);

                if (!alreadyProcessed) {
                    // Parse each bullet line as a task
                    const bullets = bulletLines.split('\n').filter(line => line.trim().startsWith('-'));
                    const createdNotes = [];

                    bullets.forEach(bulletLine => {
                        const taskContent = bulletLine.replace(/^\s*-\s*/, '').trim();
                        if (!taskContent) return;

                        // Parse using same logic as single tasks
                        let content = taskContent;
                        let category = null;
                        let uClass = null;
                        let timeMinutes = null;
                        let priority = null;

                        // Extract category - check for --u with class first
                        const uCategoryMatch = content.match(/--u(2a|2b|2c|3a|3b|5)/);
                        if (uCategoryMatch) {
                            category = 'u';
                            uClass = uCategoryMatch[1];
                            content = content.replace(/--u(2a|2b|2c|3a|3b|5)/, '').trim();
                        } else {
                            const categoryMatch = content.match(/--([khp])/);
                            if (categoryMatch) {
                                category = categoryMatch[1];
                                content = content.replace(/--[khp]/, '').trim();
                            }
                        }

                        // Extract priority (!, !!, !!!)
                        const priorityMatch = content.match(/(!{1,3})/);
                        if (priorityMatch) {
                            priority = priorityMatch[1];
                            content = content.replace(/!{1,3}/, '').trim();
                        }

                        // Extract time (e.g., "30m")
                        const timeMatch = content.match(/(\d+)m/);
                        if (timeMatch) {
                            timeMinutes = parseInt(timeMatch[1]);
                            content = content.replace(/\d+m/, '').trim();
                        }

                        // Clean up extra whitespace
                        content = content.replace(/\s+/g, ' ').trim();

                        if (content) {
                            const note = {
                                id: Date.now() + Math.random(),
                                content: content,
                                timestamp: new Date().toISOString(),
                                completed: false,
                                stackId: null, // Will be set after stack creation
                                category: category,
                                uClass: uClass,
                                timeMinutes: timeMinutes,
                                focused: false,
                                assignedDay: null,
                                priority: priority
                            };
                            createdNotes.push(note);
                        }
                    });

                    if (createdNotes.length > 0) {
                        // Reverse the order so first task is on top
                        // (rendering displays last note in array on top)
                        createdNotes.reverse();

                        // Create the stack
                        const stack = {
                            id: Date.now() + Math.random(),
                            noteIds: createdNotes.map(n => n.id),
                            type: stackType === 'seq' ? 'sequential' : 'group',
                            title: stackTitle
                        };

                        // Set stackId for all notes
                        createdNotes.forEach(note => {
                            note.stackId = stack.id;
                            this.notes.push(note);
                            this.newlyCreatedNoteIds.add(note.id); // Track for animation
                        });

                        this.stacks.push(stack);
                        this.saveNotes();
                        this.saveStacks();
                        this.render();

                        // Add to undo stack
                        this.addToUndoStack({
                            type: 'createStack',
                            data: {
                                stackId: stack.id,
                                noteIds: createdNotes.map(n => n.id)
                            }
                        });

                        // Note: IDs stay in newlyCreatedNoteIds until user switches to board/kanban view

                        // Replace entire block with green confirmation
                        const stackSymbol = stackType === 'seq' ? '→' : '+';
                        // Add a div wrapper and ensure text after it starts fresh (not green)
                        const confirmation = `<div><span class="stack-created-animation task-icon" data-stack-id="${stack.id}" style="color: #2ecc71;">${stackType}: ${stackTitle} [${stackSymbol} ${createdNotes.length} Tasks] ✓</span></div><div><br></div>`;

                        // Build a simple search pattern for the entire block in plain text
                        // Then replace it in the HTML by finding and replacing the title + all bullets + /
                        let currentHTML = this.planEditor.innerHTML;

                        // Simple approach: replace the opening line, then remove all bullet lines and the /
                        const titlePattern = new RegExp(`${stackType}:\\s*${stackTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
                        currentHTML = currentHTML.replace(titlePattern, confirmation);

                        // Remove the bullet lines and / marker from HTML
                        bullets.forEach(bulletLine => {
                            const taskContent = bulletLine.replace(/^\s*-\s*/, '').trim();
                            const bulletPattern = new RegExp(`<div>\\s*-\\s*${taskContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?</div>`, 'gi');
                            currentHTML = currentHTML.replace(bulletPattern, '');
                        });

                        // Remove the / trigger
                        currentHTML = currentHTML.replace(/<div>\s*\/\s*<\/div>/gi, '');
                        currentHTML = currentHTML.replace(/<div>\s*\/<br><\/div>/gi, '');

                        this.planEditor.innerHTML = currentHTML;

                        // Move cursor to end
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(this.planEditor);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);

                        this.savePlanText();

                        console.log('Stack created from plan:', stack, createdNotes);
                    }
                }
            });
        }

        // Then parse for single task patterns: (task content time category)
        // Examples: (Meeting vorbereiten 30m --k), (Einkaufen 15m --p)
        const taskPattern = /\(([^)]+?)\)/g;
        const matches = [...text.matchAll(taskPattern)];

        if (matches.length > 0) {
            matches.forEach(match => {
                const fullMatch = match[0];
                const innerContent = match[1].trim();

                // Check if this pattern hasn't been processed yet
                // We mark processed patterns by replacing () with []
                if (!text.includes(`[${innerContent}]`)) {
                    // Parse the content using the same logic as addNote()
                    let content = innerContent;
                    let category = null;
                    let uClass = null;
                    let timeMinutes = null;
                    let priority = null;

                    // Extract category - check for --u with class first
                    const uCategoryMatch = content.match(/--u(2a|2b|2c|3a|3b|5)/);
                    if (uCategoryMatch) {
                        category = 'u';
                        uClass = uCategoryMatch[1];
                        content = content.replace(/--u(2a|2b|2c|3a|3b|5)/, '').trim();
                    } else {
                        // Then check for other categories
                        const categoryMatch = content.match(/--([khp])/);
                        if (categoryMatch) {
                            category = categoryMatch[1];
                            content = content.replace(/--[khp]/, '').trim();
                        }
                    }

                    // Extract priority (!, !!, !!!)
                    const priorityMatch = content.match(/(!{1,3})/);
                    if (priorityMatch) {
                        priority = priorityMatch[1]; // Store as string: '!', '!!', or '!!!'
                        content = content.replace(/!{1,3}/, '').trim();
                    }

                    // Extract time (e.g., "30m")
                    const timeMatch = content.match(/(\d+)m/);
                    if (timeMatch) {
                        timeMinutes = parseInt(timeMatch[1]);
                        content = content.replace(/\d+m/, '').trim();
                    }

                    // Clean up extra whitespace
                    content = content.replace(/\s+/g, ' ').trim();

                    if (content) {
                        // Create the note
                        const note = {
                            id: Date.now() + Math.random(), // Make it unique
                            content: content,
                            timestamp: new Date().toISOString(),
                            completed: false,
                            stackId: null,
                            category: category,
                            uClass: uClass,
                            timeMinutes: timeMinutes,
                            focused: false,
                            assignedDay: null,
                            priority: priority
                        };

                        this.notes.push(note);
                        this.newlyCreatedNoteIds.add(note.id); // Track for animation
                        console.log('Created note with animation tracking:', note.id);
                        this.saveNotes();
                        this.render();

                        // Add to undo stack
                        this.addToUndoStack({
                            type: 'createNote',
                            data: {
                                noteId: note.id
                            }
                        });

                        // Note: ID stays in newlyCreatedNoteIds until user switches to board/kanban view

                        // Replace () with [] to mark as processed in HTML
                        const currentHTML = this.planEditor.innerHTML;
                        const escapedMatch = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const newHTML = currentHTML.replace(new RegExp(escapedMatch), `<span class="stack-created-animation task-icon" data-note-id="${note.id}" style="color: #2ecc71;">[${innerContent}] ✓</span>&nbsp;`);
                        this.planEditor.innerHTML = newHTML;

                        // Move cursor outside the green span
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(this.planEditor);
                        range.collapse(false); // Collapse to end
                        selection.removeAllRanges();
                        selection.addRange(range);

                        this.savePlanText();

                        console.log('Task created from plan:', note);
                    }
                }
            });
        }
    }

    savePlanText() {
        localStorage.setItem('planText', this.planEditor.innerHTML);
    }

    loadPlanText() {
        const saved = localStorage.getItem('planText');
        if (saved) {
            this.planEditor.innerHTML = saved;
        }
        // Update existing tables with new buttons (for backwards compatibility)
        this.updateExistingTables();
        // Update task icons to reflect completed state
        this.updatePlanTaskIcons();
    }

    updatePlanTaskIcons() {
        // Find all task icons in the plan editor (both single tasks and stacks)
        const taskIcons = this.planEditor.querySelectorAll('.task-icon[data-note-id]');
        const stackIcons = this.planEditor.querySelectorAll('.task-icon[data-stack-id]');

        // Update single task icons
        taskIcons.forEach(icon => {
            const noteId = parseFloat(icon.getAttribute('data-note-id'));
            const note = this.notes.find(n => n.id === noteId);

            if (note) {
                // Note still exists → not completed → remove completed class
                icon.classList.remove('completed');
            } else {
                // Note doesn't exist anymore → was completed/deleted → add completed class
                icon.classList.add('completed');
            }
        });

        // Update stack icons
        stackIcons.forEach(icon => {
            const stackId = parseFloat(icon.getAttribute('data-stack-id'));
            const stack = this.stacks.find(s => s.id === stackId);

            if (stack) {
                // Stack exists - check if all its notes are completed
                const stackNotes = stack.noteIds
                    .map(id => this.notes.find(n => n.id === id))
                    .filter(n => n); // Filter out deleted notes

                if (stackNotes.length === 0) {
                    // All notes in stack are completed/deleted
                    icon.classList.add('completed');
                } else {
                    // At least one note still exists → stack not completed
                    icon.classList.remove('completed');
                }
            } else {
                // Stack doesn't exist anymore → mark as completed
                icon.classList.add('completed');
            }
        });
    }

    updateExistingTables() {
        // Find all existing tables in plan editor
        const tables = this.planEditor.querySelectorAll('.plan-table');

        tables.forEach(table => {
            // Initialize focus tracker if not present
            if (!table._lastFocusedCell) {
                table._lastFocusedCell = null;

                // Add focus listeners to all cells (with global button support)
                const allCells = table.querySelectorAll('th, td');
                allCells.forEach(cell => {
                    cell.addEventListener('focus', () => {
                        table._lastFocusedCell = cell;
                        this.setCurrentFocusedTable(table);
                    });
                });
            }

            // Remove old table-actions divs (no longer needed, using global buttons)
            const wrapper = table.closest('.table-wrapper');
            if (wrapper) {
                const oldActions = wrapper.querySelector('.table-actions');
                if (oldActions) {
                    oldActions.remove();
                }
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    createPlanTaskWidget(note) {
        // Create a widget HTML for a task in plan view
        // Format: [ Content | 30m | KSWIL | !! ]

        let badges = '';

        // Time badge
        if (note.timeMinutes) {
            badges += `<span class="widget-badge widget-time">${note.timeMinutes}m</span>`;
        }

        // Category badge
        if (note.category) {
            let categoryLabel = '';
            let categoryClass = `widget-category-${note.category}`;

            if (note.category === 'k') categoryLabel = 'KSWIL';
            else if (note.category === 'h') categoryLabel = 'HSLU';
            else if (note.category === 'p') categoryLabel = 'Privat';
            else if (note.category === 'u') {
                categoryLabel = `Unterricht ${note.uClass || ''}`;
                categoryClass = `widget-category-u widget-class-${note.uClass}`;
            }

            badges += `<span class="widget-badge ${categoryClass}">${categoryLabel}</span>`;
        }

        // Priority badge
        if (note.priority) {
            const priorityLevel = note.priority.length; // !, !!, !!!
            badges += `<span class="widget-badge widget-priority widget-priority-${priorityLevel}">${note.priority}</span>`;
        }

        // Day badge
        if (note.assignedDay) {
            const dayLabels = {
                monday: 'Mo', tuesday: 'Di', wednesday: 'Mi',
                thursday: 'Do', friday: 'Fr', saturday: 'Sa', sunday: 'So'
            };
            const dayLabel = dayLabels[note.assignedDay] || note.assignedDay;
            badges += `<span class="widget-badge widget-day">${dayLabel}</span>`;
        }

        // Build widget HTML - use span wrapper for inline display
        const widget = `<span class="plan-task-widget-wrapper"><span class="plan-task-widget" data-note-id="${note.id}" data-task-content="${this.escapeHtml(note.content)}" contenteditable="false"><span class="widget-content">${this.escapeHtml(note.content)}</span>${badges}<button class="widget-edit-btn" title="Bearbeiten">✎</button></span></span>`;

        return widget;
    }

    // ============================================
    // SAVED NOTES MANAGEMENT
    // ============================================

    loadSavedNotes() {
        const saved = localStorage.getItem('savedPlanNotes');
        if (saved) {
            this.savedNotes = JSON.parse(saved);
        }
        this.renderSavedNotes();
        this.updateSavedNotesVisibility();
    }

    saveSavedNotes() {
        localStorage.setItem('savedPlanNotes', JSON.stringify(this.savedNotes));
        this.renderSavedNotes();
        this.updateSavedNotesVisibility();
    }

    createNewNote() {
        // Auto-save current note if it exists and is not empty
        if (this.currentSavedNoteId) {
            const currentNote = this.savedNotes.find(n => n.id === this.currentSavedNoteId);
            if (currentNote) {
                const plainText = this.getPlainText();
                if (plainText && plainText.trim().length > 0) {
                    currentNote.content = this.planEditor.innerHTML;
                    currentNote.plainText = plainText;
                    currentNote.updatedAt = Date.now();
                    this.saveSavedNotes();
                }
            }
        }

        // Clear editor and reset current note ID
        this.planEditor.innerHTML = '';
        this.currentSavedNoteId = null;
        this.renderSavedNotes(); // Re-render to remove active state
        this.planEditor.focus();
    }

    promptSavePlanNote() {
        // Check if current note is empty
        const plainText = this.getPlainText();
        if (!plainText || plainText.trim().length === 0) {
            alert('Die aktuelle Notiz ist leer und kann nicht gespeichert werden.');
            return;
        }

        // If we're editing an existing note, just update it
        if (this.currentSavedNoteId) {
            const existingNote = this.savedNotes.find(n => n.id === this.currentSavedNoteId);
            if (existingNote) {
                existingNote.content = this.planEditor.innerHTML;
                existingNote.plainText = plainText;
                existingNote.updatedAt = Date.now();
                this.saveSavedNotes();
                alert('Notiz aktualisiert!');
                return;
            }
        }

        // Prompt for name for new note
        const name = prompt('Geben Sie einen Namen für diese Notiz ein:');
        if (name && name.trim().length > 0) {
            this.savePlanNote(name.trim());
        }
    }

    savePlanNote(name) {
        const content = this.planEditor.innerHTML;
        const plainText = this.getPlainText();

        // Create new saved note
        const savedNote = {
            id: Date.now(),
            name: name,
            content: content,
            plainText: plainText,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.savedNotes.push(savedNote);
        this.currentSavedNoteId = savedNote.id;
        this.saveSavedNotes();
    }

    loadSavedNote(id) {
        // Auto-save current note if it's not empty and has an ID
        if (this.currentSavedNoteId) {
            const currentNote = this.savedNotes.find(n => n.id === this.currentSavedNoteId);
            if (currentNote) {
                const plainText = this.getPlainText();
                if (plainText && plainText.trim().length > 0) {
                    currentNote.content = this.planEditor.innerHTML;
                    currentNote.plainText = plainText;
                    currentNote.updatedAt = Date.now();
                    this.saveSavedNotes();
                }
            }
        }

        // Load selected note
        const savedNote = this.savedNotes.find(n => n.id === id);
        if (savedNote) {
            this.planEditor.innerHTML = savedNote.content;
            this.currentSavedNoteId = savedNote.id;
            this.renderSavedNotes(); // Re-render to show active state
        }
    }

    deleteSavedNote(id, event) {
        event.stopPropagation(); // Prevent loading the note when clicking delete

        if (!confirm('Möchten Sie diese Notiz wirklich löschen?')) {
            return;
        }

        this.savedNotes = this.savedNotes.filter(n => n.id !== id);

        // If deleting the current note, clear editor
        if (this.currentSavedNoteId === id) {
            this.planEditor.innerHTML = '';
            this.currentSavedNoteId = null;
        }

        this.saveSavedNotes();
    }

    renderSavedNotes() {
        this.savedNotesList.innerHTML = '';

        this.savedNotes.forEach(savedNote => {
            const item = document.createElement('div');
            item.className = 'saved-note-item';
            if (savedNote.id === this.currentSavedNoteId) {
                item.classList.add('active');
            }

            // Create preview text (first 50 chars)
            const preview = savedNote.plainText.substring(0, 50) +
                           (savedNote.plainText.length > 50 ? '...' : '');

            item.innerHTML = `
                <div class="saved-note-item-header">
                    <div class="saved-note-name">${savedNote.name}</div>
                    <button class="saved-note-delete" title="Löschen">×</button>
                </div>
                <div class="saved-note-preview">${preview}</div>
            `;

            // Add click handler to load note
            item.addEventListener('click', () => this.loadSavedNote(savedNote.id));

            // Add delete handler
            const deleteBtn = item.querySelector('.saved-note-delete');
            deleteBtn.addEventListener('click', (e) => this.deleteSavedNote(savedNote.id, e));

            this.savedNotesList.appendChild(item);
        });

        // Update counter
        this.savedNotesCount.textContent = `${this.savedNotes.length}`;
    }

    updateSavedNotesVisibility() {
        // Sidebar is always available via toggle button, no auto-hide
        // Just restore saved state from localStorage
        const savedState = localStorage.getItem('savedNotesSidebarVisible');
        if (savedState === 'true') {
            this.savedNotesSidebarVisible = true;
            this.savedNotesSidebar.classList.add('visible');
            this.sidebarOverlay.classList.add('visible');
        }
    }

    toggleSavedNotesSidebar() {
        this.savedNotesSidebarVisible = !this.savedNotesSidebarVisible;
        if (this.savedNotesSidebarVisible) {
            this.savedNotesSidebar.classList.add('visible');
            this.sidebarOverlay.classList.add('visible');
        } else {
            this.savedNotesSidebar.classList.remove('visible');
            this.sidebarOverlay.classList.remove('visible');
        }
        // Save state to localStorage
        localStorage.setItem('savedNotesSidebarVisible', this.savedNotesSidebarVisible);
    }

    // ============================================
    // COMMAND PALETTE
    // ============================================

    openCommandPalette() {
        // Define available commands
        this.commandPaletteCommands = [
            {
                id: 'view-board',
                title: 'Wechsle zu Board View',
                description: 'Standard-Ansicht mit Grid-Layout',
                icon: '⊟',
                action: () => this.switchToView('board'),
                condition: () => this.currentView !== 'board'
            },
            {
                id: 'view-calendar',
                title: 'Wechsle zu Kalender View',
                description: 'Monatsübersicht mit Deadlines',
                icon: '⊞',
                action: () => this.switchToView('calendar'),
                condition: () => this.currentView !== 'calendar'
            },
            {
                id: 'view-plan',
                title: 'Wechsle zu Plan View',
                description: 'Notizen und Planung',
                icon: '✎',
                action: () => this.switchToView('plan'),
                condition: () => this.currentView !== 'plan'
            },
            {
                id: 'new-note',
                title: 'Neue Notiz',
                description: 'Erstelle eine neue Notiz',
                icon: '+',
                action: () => {
                    if (this.currentView === 'plan') {
                        this.createNewNote();
                    } else {
                        this.noteInput.focus();
                    }
                }
            },
            {
                id: 'save-note',
                title: 'Notiz speichern',
                description: 'Speichere aktuelle Plan-Notiz',
                icon: '⊡',
                action: () => {
                    if (this.currentView === 'plan') {
                        this.promptSavePlanNote();
                    }
                },
                condition: () => this.currentView === 'plan'
            },
            {
                id: 'clear-filters',
                title: 'Filter zurücksetzen',
                description: 'Alle aktiven Filter entfernen',
                icon: '×',
                action: () => this.clearAllFilters(),
                condition: () => this.activeFilters.size > 0
            },
            {
                id: 'undo',
                title: 'Rückgängig machen',
                description: 'Letzte Aktion rückgängig machen',
                icon: '↺',
                action: () => this.undo(),
                condition: () => this.undoStack.length > 0
            }
        ];

        // Filter commands based on conditions
        this.commandPaletteCommands = this.commandPaletteCommands.filter(cmd => {
            return !cmd.condition || cmd.condition();
        });

        this.commandPaletteSelectedIndex = 0;
        this.commandPaletteKeyHeld = true;
        this.commandPalette.style.display = 'flex';
        this.renderCommandPalette();
    }

    closeCommandPalette() {
        this.commandPalette.style.display = 'none';
        this.commandPaletteKeyHeld = false;
        this.commandPaletteSelectedIndex = 0;
    }

    navigateCommandPalette(direction) {
        this.commandPaletteSelectedIndex += direction;

        // Wrap around
        if (this.commandPaletteSelectedIndex < 0) {
            this.commandPaletteSelectedIndex = this.commandPaletteCommands.length - 1;
        } else if (this.commandPaletteSelectedIndex >= this.commandPaletteCommands.length) {
            this.commandPaletteSelectedIndex = 0;
        }

        this.renderCommandPalette();
    }

    executeSelectedCommand() {
        if (this.commandPaletteCommands[this.commandPaletteSelectedIndex]) {
            this.commandPaletteCommands[this.commandPaletteSelectedIndex].action();
            this.closeCommandPalette();
        }
    }

    renderCommandPalette() {
        this.commandPaletteBody.innerHTML = '';

        if (this.commandPaletteCommands.length === 0) {
            this.commandPaletteBody.innerHTML = '<div class="command-palette-empty">Keine Befehle verfügbar</div>';
            return;
        }

        this.commandPaletteCommands.forEach((cmd, index) => {
            const item = document.createElement('div');
            item.className = 'command-item';
            if (index === this.commandPaletteSelectedIndex) {
                item.classList.add('selected');
            }

            item.innerHTML = `
                <div class="command-icon">${cmd.icon}</div>
                <div class="command-info">
                    <div class="command-title">${cmd.title}</div>
                    ${cmd.description ? `<div class="command-description">${cmd.description}</div>` : ''}
                </div>
            `;

            item.addEventListener('click', () => {
                cmd.action();
                this.closeCommandPalette();
            });

            this.commandPaletteBody.appendChild(item);
        });
    }

    typewriterScroll() {
        // Typewriter mode: keep current line centered vertically
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // If cursor is not visible (rect height is 0), try to get it from a temporary element
        let cursorTop = rect.top;
        let cursorHeight = rect.height;

        if (cursorHeight === 0) {
            // Cursor might be at the end of a line, create a temporary span to measure
            const tempSpan = document.createElement('span');
            tempSpan.textContent = '\u200B'; // Zero-width space
            range.insertNode(tempSpan);
            const tempRect = tempSpan.getBoundingClientRect();
            cursorTop = tempRect.top;
            cursorHeight = tempRect.height;
            tempSpan.remove();
        }

        // Get editor container
        const editorContainer = this.planEditor.parentElement;
        const containerRect = editorContainer.getBoundingClientRect();

        // Calculate middle of viewport
        const viewportMiddle = window.innerHeight / 2;

        // Calculate how much to scroll to center the cursor
        const cursorMiddle = cursorTop + (cursorHeight / 2);
        const scrollOffset = cursorMiddle - viewportMiddle;

        // Smooth scroll the container
        if (Math.abs(scrollOffset) > 5) { // Only scroll if offset is significant
            editorContainer.scrollBy({
                top: scrollOffset,
                behavior: 'smooth'
            });
        }
    }

    // ========== Floating Formatting Toolbar ==========

    initFloatingToolbar() {
        // Listen for text selection in plan editor
        document.addEventListener('selectionchange', () => {
            if (this.currentView !== 'plan') return;
            this.handleTextSelection();
        });

        // Bold button
        document.getElementById('toolbarBold').addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('bold', false, null);
            this.savePlanText();
        });

        // Italic button
        document.getElementById('toolbarItalic').addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('italic', false, null);
            this.savePlanText();
        });

        // Highlight buttons
        const highlightButtons = this.floatingToolbar.querySelectorAll('.toolbar-highlight');
        highlightButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const color = btn.dataset.color;
                this.applyHighlight(color);
            });
        });

        // Remove formatting button
        document.getElementById('toolbarRemove').addEventListener('click', (e) => {
            e.preventDefault();
            this.removeHighlight();
        });
    }

    handleTextSelection() {
        const selection = window.getSelection();

        // Hide toolbar if no selection or selection is collapsed (cursor)
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            this.hideFloatingToolbar();
            return;
        }

        // Check if selection is within plan editor
        const range = selection.getRangeAt(0);
        if (!this.planEditor.contains(range.commonAncestorContainer)) {
            this.hideFloatingToolbar();
            return;
        }

        // Get selected text
        const selectedText = selection.toString().trim();
        if (selectedText.length === 0) {
            this.hideFloatingToolbar();
            return;
        }

        // Show and position toolbar
        this.showFloatingToolbar(range);
    }

    showFloatingToolbar(range) {
        const rect = range.getBoundingClientRect();

        // Position toolbar above selection
        const toolbarHeight = 40; // Approximate height
        const toolbarWidth = this.floatingToolbar.offsetWidth || 300; // Fallback width

        // Calculate position
        let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
        let top = rect.top - toolbarHeight - 8; // 8px gap above selection

        // Keep toolbar within viewport
        const margin = 10;
        if (left < margin) left = margin;
        if (left + toolbarWidth > window.innerWidth - margin) {
            left = window.innerWidth - toolbarWidth - margin;
        }

        // If toolbar would be above viewport, show below selection instead
        if (top < margin) {
            top = rect.bottom + 8;
        }

        // Apply position
        this.floatingToolbar.style.left = `${left}px`;
        this.floatingToolbar.style.top = `${top}px`;
        this.floatingToolbar.classList.add('visible');
    }

    hideFloatingToolbar() {
        this.floatingToolbar.classList.remove('visible');
    }

    applyHighlight(color) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        // Map color names to CSS values
        const colorMap = {
            'yellow': '#FFF4CC',
            'green': '#D4EDDA',
            'blue': '#D1ECF1',
            'purple': '#E7D4F5'
        };

        const bgColor = colorMap[color] || '#FFF4CC';

        // Create highlight span
        const span = document.createElement('span');
        span.style.backgroundColor = bgColor;
        span.style.color = '#000'; // Black text on pastel background
        span.style.padding = '2px 0';
        span.style.borderRadius = '2px';
        span.className = 'text-highlight';
        span.dataset.highlightColor = color;

        // Wrap selected content
        try {
            range.surroundContents(span);
        } catch (e) {
            // If surroundContents fails (e.g., selection spans multiple elements),
            // use a different approach
            const fragment = range.extractContents();
            span.appendChild(fragment);
            range.insertNode(span);
        }

        // Insert a zero-width space after the highlight so cursor can escape
        const escapeSpace = document.createTextNode('\u200B');
        span.parentNode.insertBefore(escapeSpace, span.nextSibling);

        // Move cursor after the highlight (to the escape space)
        const newRange = document.createRange();
        newRange.setStartAfter(escapeSpace);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Save changes
        this.savePlanText();

        // Hide toolbar
        this.hideFloatingToolbar();
    }

    removeHighlight() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;

        // Find highlight span
        let highlightSpan = null;
        if (commonAncestor.nodeType === Node.ELEMENT_NODE &&
            commonAncestor.classList &&
            commonAncestor.classList.contains('text-highlight')) {
            highlightSpan = commonAncestor;
        } else if (commonAncestor.parentElement &&
                   commonAncestor.parentElement.classList &&
                   commonAncestor.parentElement.classList.contains('text-highlight')) {
            highlightSpan = commonAncestor.parentElement;
        }

        if (highlightSpan) {
            // Unwrap the highlight span
            const parent = highlightSpan.parentNode;
            while (highlightSpan.firstChild) {
                parent.insertBefore(highlightSpan.firstChild, highlightSpan);
            }
            parent.removeChild(highlightSpan);

            // Save changes
            this.savePlanText();
        }

        // Clear selection
        selection.removeAllRanges();

        // Hide toolbar
        this.hideFloatingToolbar();
    }

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NotesApp();
});
