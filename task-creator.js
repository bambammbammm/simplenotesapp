/**
 * Universal Task/Stack Creator
 * Triggered by Option+N (Alt+N)
 * Works in both Plan and Board modes
 */

(function() {
    'use strict';

    // Modal elements
    const modal = document.getElementById('taskCreatorModal');
    const overlay = modal.querySelector('.task-creator-overlay');
    const closeBtn = document.getElementById('taskCreatorClose');
    const cancelBtn = document.getElementById('taskCreatorCancel');
    const submitBtn = document.getElementById('taskCreatorSubmit');

    // Input elements
    const contentInput = document.getElementById('taskCreatorContent');
    const timeInput = document.getElementById('taskCreatorTime');
    const categorySelect = document.getElementById('taskCreatorCategory');
    const classGroup = document.getElementById('taskCreatorClassGroup');
    const classSelect = document.getElementById('taskCreatorClass');
    const daySelect = document.getElementById('taskCreatorDay');
    const priorityButtons = document.querySelectorAll('.priority-btn');

    // Task list elements
    const addTaskBtn = document.getElementById('taskCreatorAddBtn');
    const taskList = document.getElementById('taskCreatorList');
    const taskListItems = document.getElementById('taskCreatorListItems');

    // Stack options
    const stackOptions = document.getElementById('taskCreatorStackOptions');
    const stackTypeButtons = document.querySelectorAll('.stack-type-btn');
    const stackTitleGroup = document.getElementById('taskCreatorStackTitleGroup');
    const stackTitleInput = document.getElementById('taskCreatorStackTitle');

    // State
    let tasks = []; // Array of task objects
    let currentPriority = '';
    let currentStackType = 'none';
    let creatorContext = null; // For Plan mode: stores cursor position/element

    // ============================================
    // OPEN/CLOSE MODAL
    // ============================================

    function openModal(context = null) {
        creatorContext = context;
        modal.style.display = 'flex';
        contentInput.focus();
        resetModal();
    }

    function closeModal() {
        modal.style.display = 'none';
        resetModal();
        creatorContext = null;
    }

    function resetModal() {
        // Clear inputs
        contentInput.value = '';
        timeInput.value = '';
        categorySelect.value = '';
        classGroup.style.display = 'none';
        daySelect.value = '';

        // Reset priority
        currentPriority = '';
        priorityButtons.forEach(btn => btn.classList.remove('active'));

        // Reset tasks list
        tasks = [];
        taskList.style.display = 'none';
        taskListItems.innerHTML = '';

        // Reset stack options
        currentStackType = 'none';
        stackOptions.style.display = 'none';
        stackTitleGroup.style.display = 'none';
        stackTitleInput.value = '';
        stackTypeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'none');
        });

        // Clear edit mode
        delete modal.dataset.editMode;
        delete modal.dataset.editId;
        submitBtn.textContent = 'Erstellen';
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Close modal
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Category change: show/hide class selector
    categorySelect.addEventListener('change', () => {
        if (categorySelect.value === 'u') {
            classGroup.style.display = 'block';
        } else {
            classGroup.style.display = 'none';
        }
    });

    // Priority buttons
    priorityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.value;
            currentPriority = value;

            priorityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Add task button
    addTaskBtn.addEventListener('click', () => {
        addCurrentTask();
    });

    // Enter in content input: add task
    contentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCurrentTask();
        }
    });

    // Stack type buttons
    stackTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            currentStackType = type;

            stackTypeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show title input if not "none"
            if (type !== 'none') {
                stackTitleGroup.style.display = 'block';
            } else {
                stackTitleGroup.style.display = 'none';
            }
        });
    });

    // Submit button
    submitBtn.addEventListener('click', () => {
        handleSubmit();
    });

    // ============================================
    // TASK MANAGEMENT
    // ============================================

    function addCurrentTask() {
        const content = contentInput.value.trim();

        if (!content) {
            contentInput.focus();
            return;
        }

        const task = {
            id: Date.now() + Math.random(),
            content: content,
            timeMinutes: timeInput.value ? parseInt(timeInput.value) : null,
            category: categorySelect.value || null,
            uClass: (categorySelect.value === 'u' ? classSelect.value : null),
            priority: currentPriority || null,
            assignedDay: daySelect.value || null
        };

        tasks.push(task);
        renderTaskList();

        // Clear inputs for next task
        contentInput.value = '';
        timeInput.value = '';
        contentInput.focus();

        // Show task list and stack options
        taskList.style.display = 'block';
        stackOptions.style.display = 'block';
    }

    function removeTask(taskId) {
        tasks = tasks.filter(t => t.id !== taskId);
        renderTaskList();

        // Hide list if empty
        if (tasks.length === 0) {
            taskList.style.display = 'none';
            stackOptions.style.display = 'none';
        }
    }

    function moveTaskUp(taskId) {
        const index = tasks.findIndex(t => t.id === taskId);
        if (index > 0) {
            // Swap with previous task
            [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
            renderTaskList();
        }
    }

    function moveTaskDown(taskId) {
        const index = tasks.findIndex(t => t.id === taskId);
        if (index < tasks.length - 1) {
            // Swap with next task
            [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
            renderTaskList();
        }
    }

    function renderTaskList() {
        const html = tasks.map((task, index) => {
            let badges = '';

            if (task.timeMinutes) {
                badges += `<span style="color: #3498db;">${task.timeMinutes}m</span>`;
            }

            if (task.category) {
                const categoryLabels = { k: 'KSWIL', h: 'HSLU', p: 'Privat', u: 'Unterricht' };
                let label = categoryLabels[task.category];
                if (task.category === 'u' && task.uClass) {
                    label += ` ${task.uClass}`;
                }
                badges += ` <span style="color: #7FDBDA;">${label}</span>`;
            }

            if (task.priority) {
                badges += ` <span style="color: #f39c12;">${task.priority}</span>`;
            }

            // Show reorder buttons only if more than 1 task
            const showReorder = tasks.length > 1;
            const upDisabled = index === 0 ? 'disabled' : '';
            const downDisabled = index === tasks.length - 1 ? 'disabled' : '';

            return `
                <div class="task-creator-list-item">
                    <span>${task.content} ${badges}</span>
                    <div class="task-creator-list-item-actions">
                        ${showReorder ? `
                            <button class="task-creator-list-item-up" data-task-id="${task.id}" ${upDisabled}>↑</button>
                            <button class="task-creator-list-item-down" data-task-id="${task.id}" ${downDisabled}>↓</button>
                        ` : ''}
                        <button class="task-creator-list-item-remove" data-task-id="${task.id}">×</button>
                    </div>
                </div>
            `;
        }).join('');

        taskListItems.innerHTML = html;

        // Add remove handlers
        taskListItems.querySelectorAll('.task-creator-list-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = parseFloat(btn.dataset.taskId);
                removeTask(taskId);
            });
        });

        // Add up/down handlers
        taskListItems.querySelectorAll('.task-creator-list-item-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = parseFloat(btn.dataset.taskId);
                moveTaskUp(taskId);
            });
        });

        taskListItems.querySelectorAll('.task-creator-list-item-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = parseFloat(btn.dataset.taskId);
                moveTaskDown(taskId);
            });
        });
    }

    // ============================================
    // SUBMIT LOGIC
    // ============================================

    function handleSubmit() {
        // Check if in edit mode
        const editMode = modal.dataset.editMode;
        const editId = parseFloat(modal.dataset.editId);

        if (editMode === 'note') {
            // Update existing note
            updateNote(editId);
            closeModal();
            return;
        } else if (editMode === 'stack') {
            // Update existing stack
            updateStack(editId);
            closeModal();
            return;
        }

        // CREATE MODE (not edit)
        // Check if we have any tasks
        const hasCurrentInput = contentInput.value.trim().length > 0;

        if (tasks.length === 0 && !hasCurrentInput) {
            alert('Bitte mindestens eine Task eingeben!');
            contentInput.focus();
            return;
        }

        // Add current input as task if exists
        if (hasCurrentInput) {
            addCurrentTask();
        }

        // Now create notes/stack
        if (tasks.length === 1 && currentStackType === 'none') {
            // Single task - create single note
            createSingleNote(tasks[0]);
        } else if (tasks.length > 1 || currentStackType !== 'none') {
            // Multiple tasks or stack requested - create stack
            const stackTitle = stackTitleInput.value.trim() || 'Untitled Stack';
            createStack(tasks, currentStackType, stackTitle);
        }

        closeModal();
    }

    function createSingleNote(task) {
        const note = {
            id: Date.now() + Math.random(),
            content: task.content,
            timestamp: new Date().toISOString(),
            completed: false,
            stackId: null,
            category: task.category,
            uClass: task.uClass,
            timeMinutes: task.timeMinutes,
            focused: false,
            assignedDay: task.assignedDay,
            priority: task.priority
        };

        window.app.notes.push(note);
        window.app.newlyCreatedNoteIds.add(note.id);
        window.app.saveNotes();
        window.app.render();

        // Add to undo stack
        window.app.addToUndoStack({
            type: 'createNote',
            data: { noteId: note.id }
        });

        // If in plan mode, insert icon
        if (creatorContext && creatorContext.mode === 'plan') {
            insertTaskIconInPlan(note);
        }

        console.log('Single note created:', note);
    }

    function createStack(tasks, stackType, stackTitle) {
        // Create notes for all tasks
        const notes = tasks.map(task => {
            return {
                id: Date.now() + Math.random(),
                content: task.content,
                timestamp: new Date().toISOString(),
                completed: false,
                stackId: null, // Will be set after stack creation
                category: task.category,
                uClass: task.uClass,
                timeMinutes: task.timeMinutes,
                focused: false,
                assignedDay: task.assignedDay,
                priority: task.priority
            };
        });

        // Reverse order (first task = top of stack)
        notes.reverse();

        // Create stack
        const stack = {
            id: Date.now() + Math.random(),
            noteIds: notes.map(n => n.id),
            type: stackType === 'group' ? 'group' : 'sequential',
            title: stackTitle
        };

        // Set stackId for all notes
        notes.forEach(note => {
            note.stackId = stack.id;
            window.app.notes.push(note);
            window.app.newlyCreatedNoteIds.add(note.id);
        });

        window.app.stacks.push(stack);
        window.app.saveNotes();
        window.app.saveStacks();
        window.app.render();

        // Add to undo stack
        window.app.addToUndoStack({
            type: 'createStack',
            data: {
                stackId: stack.id,
                noteIds: notes.map(n => n.id)
            }
        });

        // If in plan mode, insert icon
        if (creatorContext && creatorContext.mode === 'plan') {
            insertStackIconInPlan(stack);
        }

        console.log('Stack created:', stack, notes);
    }

    function updateNote(noteId) {
        // Find the note
        const note = window.app.notes.find(n => n.id === noteId);
        if (!note) return;

        // Get values from modal - either from contentInput (single note edit) or tasks[0] (if added to list)
        let content, timeMinutes, category, uClass, priority, assignedDay;

        if (tasks.length > 0) {
            // User added task to list - use first task
            const task = tasks[0];
            content = task.content;
            timeMinutes = task.timeMinutes;
            category = task.category;
            uClass = task.uClass;
            priority = task.priority;
            assignedDay = task.assignedDay;
        } else {
            // User editing directly in inputs without adding to list
            content = contentInput.value.trim();
            timeMinutes = timeInput.value ? parseInt(timeInput.value) : null;
            category = categorySelect.value || null;
            uClass = (categorySelect.value === 'u' ? classSelect.value : null);
            priority = currentPriority || null;
            assignedDay = daySelect.value || null;
        }

        // Update note
        note.content = content;
        note.timeMinutes = timeMinutes;
        note.category = category;
        note.uClass = uClass;
        note.priority = priority;
        note.assignedDay = assignedDay;

        // Save and render
        window.app.saveNotes();
        window.app.render();

        // Update icon title if in plan mode
        const icon = document.querySelector(`.plan-task-icon[data-note-id="${noteId}"]`);
        if (icon) {
            icon.title = content;
        }

        console.log('Note updated:', note);
    }

    function updateStack(stackId) {
        // Find the stack
        const stack = window.app.stacks.find(s => s.id === stackId);
        if (!stack) return;

        // Get current note IDs before update
        const oldNoteIds = [...stack.noteIds];

        // Update stack metadata
        stack.type = currentStackType === 'group' ? 'group' : 'sequential';
        stack.title = stackTitleInput.value.trim() || 'Untitled Stack';

        // Handle task changes
        // Get the new task order from tasks array
        const newTaskIds = tasks.map(t => t.id);
        const newNoteIds = [];

        // Update existing notes and track which ones are still in the stack
        newTaskIds.forEach(taskId => {
            const task = tasks.find(t => t.id === taskId);
            let note = window.app.notes.find(n => n.id === taskId);

            if (note) {
                // Update existing note
                note.content = task.content;
                note.timeMinutes = task.timeMinutes;
                note.category = task.category;
                note.uClass = task.uClass;
                note.priority = task.priority;
                note.assignedDay = task.assignedDay;
                note.stackId = stackId;
                newNoteIds.push(note.id);
            } else {
                // Create new note (task was added in edit mode)
                note = {
                    id: taskId,
                    content: task.content,
                    timestamp: new Date().toISOString(),
                    completed: false,
                    stackId: stackId,
                    category: task.category,
                    uClass: task.uClass,
                    timeMinutes: task.timeMinutes,
                    focused: false,
                    assignedDay: task.assignedDay,
                    priority: task.priority
                };
                window.app.notes.push(note);
                newNoteIds.push(note.id);
            }
        });

        // Remove notes that were deleted from stack
        const removedNoteIds = oldNoteIds.filter(id => !newNoteIds.includes(id));
        removedNoteIds.forEach(noteId => {
            const note = window.app.notes.find(n => n.id === noteId);
            if (note) {
                // Unstack the note (set stackId to null)
                note.stackId = null;
            }
        });

        // Update stack noteIds (in same order as tasks array - reversed for stack display)
        stack.noteIds = newNoteIds.reverse();

        // Save and render
        window.app.saveNotes();
        window.app.saveStacks();
        window.app.render();

        // Update icon if in plan mode
        const icon = document.querySelector(`.plan-stack-icon[data-stack-id="${stackId}"]`);
        if (icon) {
            icon.textContent = stack.type === 'group' ? '⊞' : '⊟';
            icon.title = stack.title;
        }

        console.log('Stack updated:', stack);
    }

    // ============================================
    // PLAN MODE: INSERT ICON
    // ============================================

    function insertTaskIconInPlan(note) {
        // Insert a clickable icon at cursor position
        // Icon format: □ (white square)
        const icon = document.createElement('span');
        icon.className = 'plan-task-icon';
        icon.contentEditable = 'false';
        icon.textContent = '□';
        icon.dataset.noteId = note.id;
        icon.title = note.content;

        // Add click handler to open modal for editing
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModalForEdit(note.id, 'note');
        });

        // Insert at cursor or at end of plan editor
        const planEditor = document.getElementById('planEditor');
        if (!planEditor) return;

        const selection = window.getSelection();
        if (selection.rangeCount > 0 && planEditor.contains(selection.anchorNode)) {
            // Insert at cursor position
            const range = selection.getRangeAt(0);
            range.deleteContents(); // Remove any selected text
            range.insertNode(icon);

            // Add space after icon
            const space = document.createTextNode(' ');
            range.insertNode(space);

            // Move cursor after space
            range.setStartAfter(space);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Append to end if no valid cursor position
            planEditor.appendChild(icon);
            planEditor.appendChild(document.createTextNode(' '));
        }

        // Save plan text
        if (window.app && window.app.savePlanText) {
            window.app.savePlanText();
        }

        console.log('Icon inserted for note:', note.id);
    }

    function insertStackIconInPlan(stack) {
        // Insert a clickable icon for stack
        // Icon format: ⊞ (squared plus for group) or ⊟ (squared minus for sequential)
        const icon = document.createElement('span');
        icon.className = 'plan-task-icon plan-stack-icon';
        icon.contentEditable = 'false';
        icon.textContent = stack.type === 'group' ? '⊞' : '⊟';
        icon.dataset.stackId = stack.id;
        icon.title = stack.title;

        // Add click handler to open modal for editing
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModalForEdit(stack.id, 'stack');
        });

        // Insert at cursor or at end of plan editor
        const planEditor = document.getElementById('planEditor');
        if (!planEditor) return;

        const selection = window.getSelection();
        if (selection.rangeCount > 0 && planEditor.contains(selection.anchorNode)) {
            // Insert at cursor position
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(icon);

            // Add space after icon
            const space = document.createTextNode(' ');
            range.insertNode(space);

            // Move cursor after space
            range.setStartAfter(space);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Append to end if no valid cursor position
            planEditor.appendChild(icon);
            planEditor.appendChild(document.createTextNode(' '));
        }

        // Save plan text
        if (window.app && window.app.savePlanText) {
            window.app.savePlanText();
        }

        console.log('Stack icon inserted:', stack.id);
    }

    // ============================================
    // EDIT MODE: OPEN MODAL FOR EXISTING TASK/STACK
    // ============================================

    function openModalForEdit(id, type) {
        if (!window.app) return;

        // IMPORTANT: Open modal FIRST (which resets everything),
        // THEN populate with edit data
        const context = type === 'note'
            ? { mode: 'edit-note', noteId: id }
            : { mode: 'edit-stack', stackId: id };

        // Show modal and reset (this clears everything)
        creatorContext = context;
        modal.style.display = 'flex';
        resetModal();

        if (type === 'note') {
            // Find note
            const note = window.app.notes.find(n => n.id === id);
            if (!note) return;

            // Populate modal with note data
            contentInput.value = note.content;
            timeInput.value = note.timeMinutes || '';
            categorySelect.value = note.category || '';

            if (note.category === 'u' && note.uClass) {
                classGroup.style.display = 'block';
                classSelect.value = note.uClass;
            }

            daySelect.value = note.assignedDay || '';

            // Set priority
            currentPriority = note.priority || '';
            priorityButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === currentPriority);
            });

            // Set edit mode
            modal.dataset.editMode = 'note';
            modal.dataset.editId = id;

            // Change button text
            submitBtn.textContent = 'Speichern';

            // Focus content input
            contentInput.focus();

        } else if (type === 'stack') {
            // Find stack
            const stack = window.app.stacks.find(s => s.id === id);
            if (!stack) return;

            // Load all notes in stack (AFTER reset!)
            tasks = stack.noteIds.map(noteId => {
                const note = window.app.notes.find(n => n.id === noteId);
                if (!note) return null;

                return {
                    id: note.id,
                    content: note.content,
                    timeMinutes: note.timeMinutes,
                    category: note.category,
                    uClass: note.uClass,
                    priority: note.priority,
                    assignedDay: note.assignedDay
                };
            }).filter(Boolean);

            // Render task list
            if (tasks.length > 0) {
                taskList.style.display = 'block';
                stackOptions.style.display = 'block';
                renderTaskList();
            }

            // Set stack type
            currentStackType = stack.type;
            stackTypeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === currentStackType);
            });

            // Set stack title
            stackTitleInput.value = stack.title;
            if (currentStackType !== 'none') {
                stackTitleGroup.style.display = 'block';
            }

            // Set edit mode
            modal.dataset.editMode = 'stack';
            modal.dataset.editId = id;

            // Change button text
            submitBtn.textContent = 'Speichern';

            // Focus content input for adding more tasks
            contentInput.focus();
        }
    }

    // ============================================
    // GLOBAL KEYBOARD SHORTCUT: Cmd+K
    // ============================================

    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        // Cmd+K (Ctrl+K on Windows) to open modal
        // Skip if in input/textarea (except plan editor)
        const inInput = e.target.matches('input, textarea') && e.target.id !== 'planEditor';

        if (cmdOrCtrl && e.key === 'k' && !inInput) {
            e.preventDefault();

            // Determine context
            const inPlanView = window.app.planView.style.display !== 'none';
            const context = inPlanView ? { mode: 'plan' } : { mode: 'board' };

            openModal(context);
        }
    });

    // ============================================
    // EXPOSE API
    // ============================================

    window.TASK_CREATOR = {
        openModal,
        closeModal,
        openModalForEdit
    };

})();
