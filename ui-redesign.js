/**
 * UI Redesign: New Header, Filter Command Palette, Bottom Bar
 * This file handles the new UI interactions
 */

(function() {
    'use strict';

    // ============================================
    // FILTER COMMAND PALETTE
    // ============================================

    const filterPalette = document.getElementById('filterCommandPalette');
    const filterPaletteInput = document.getElementById('filterPaletteInput');
    const filterPaletteTrigger = document.getElementById('filterPaletteTrigger');
    const filterPaletteSuggestions = document.getElementById('filterPaletteSuggestions');
    const filterChipsBar = document.getElementById('filterChipsBar');
    const filterChipsContainer = document.getElementById('filterChipsContainer');

    // Active filters state
    let activeFilters = new Set();

    // Filter definitions
    const filterDefinitions = [
        // Categories
        { key: '--k', desc: 'KSWIL Kategorie', type: 'category', value: 'k' },
        { key: '--h', desc: 'HSLU Kategorie', type: 'category', value: 'h' },
        { key: '--p', desc: 'Privat Kategorie', type: 'category', value: 'p' },
        { key: '--u', desc: 'Unterricht Kategorie', type: 'category', value: 'u' },

        // Classes
        { key: '--2a', desc: 'Klasse 2a', type: 'class', value: '2a' },
        { key: '--2b', desc: 'Klasse 2b', type: 'class', value: '2b' },
        { key: '--2c', desc: 'Klasse 2c', type: 'class', value: '2c' },
        { key: '--3a', desc: 'Klasse 3a', type: 'class', value: '3a' },
        { key: '--3b', desc: 'Klasse 3b', type: 'class', value: '3b' },
        { key: '--5', desc: 'Klasse 5', type: 'class', value: '5' },

        // Time filters
        { key: '≤15m', desc: 'Bis 15 Minuten', type: 'time', value: '0-15' },
        { key: '16-30m', desc: '16 bis 30 Minuten', type: 'time', value: '16-30' },
        { key: '31-60m', desc: '31 bis 60 Minuten', type: 'time', value: '31-60' },
        { key: '60m+', desc: 'Über 60 Minuten', type: 'time', value: '60+' },

        // Priority
        { key: '!', desc: 'Priorität niedrig', type: 'priority', value: '1' },
        { key: '!!', desc: 'Priorität mittel', type: 'priority', value: '2' },
        { key: '!!!', desc: 'Priorität hoch', type: 'priority', value: '3' },

        // Days (diese Woche)
        { key: 'Mo', desc: 'Montag (diese Woche)', type: 'day', value: 'monday' },
        { key: 'Di', desc: 'Dienstag (diese Woche)', type: 'day', value: 'tuesday' },
        { key: 'Mi', desc: 'Mittwoch (diese Woche)', type: 'day', value: 'wednesday' },
        { key: 'Do', desc: 'Donnerstag (diese Woche)', type: 'day', value: 'thursday' },
        { key: 'Fr', desc: 'Freitag (diese Woche)', type: 'day', value: 'friday' },
        { key: 'Sa', desc: 'Samstag (diese Woche)', type: 'day', value: 'saturday' },
        { key: 'So', desc: 'Sonntag (diese Woche)', type: 'day', value: 'sunday' },
        { key: 'Keine', desc: 'Keine Deadline', type: 'day', value: 'unassigned' },

        // Actions
        { key: 'clear', desc: 'Alle Filter entfernen', type: 'action', value: 'clear' },
    ];

    // Open/Close palette
    function openFilterPalette() {
        filterPalette.style.display = 'flex';
        filterPaletteInput.value = '';
        filterPaletteInput.focus();
        renderSuggestions('');
    }

    function closeFilterPalette() {
        filterPalette.style.display = 'none';
    }

    // Render suggestions based on input
    function renderSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        const filtered = filterDefinitions.filter(f =>
            f.key.toLowerCase().includes(lowerQuery) ||
            f.desc.toLowerCase().includes(lowerQuery)
        );

        const html = filtered.map(f => {
            const isActive = activeFilters.has(`${f.type}-${f.value}`);
            return `
                <div class="filter-suggestion ${isActive ? 'active' : ''}" data-type="${f.type}" data-value="${f.value}">
                    <span class="filter-suggestion-key">${f.key}</span>
                    <span class="filter-suggestion-desc">${f.desc}</span>
                    ${isActive ? '<span style="margin-left: auto; color: #3498db;">✓</span>' : ''}
                </div>
            `;
        }).join('');

        filterPaletteSuggestions.innerHTML = html || '<div class="filter-suggestion" style="color: #666;">Keine Ergebnisse</div>';

        // Add click handlers
        document.querySelectorAll('.filter-suggestion[data-type]').forEach(el => {
            el.addEventListener('click', () => {
                const type = el.dataset.type;
                const value = el.dataset.value;

                if (type === 'action' && value === 'clear') {
                    clearAllFilters();
                    closeFilterPalette();
                } else {
                    toggleFilter(type, value);
                }
            });
        });
    }

    // Toggle filter
    function toggleFilter(type, value) {
        const filterId = `${type}-${value}`;

        if (activeFilters.has(filterId)) {
            activeFilters.delete(filterId);
        } else {
            activeFilters.add(filterId);
        }

        applyFilters();
        updateFilterChips();
        updateFilterTrigger();
        renderSuggestions(filterPaletteInput.value);
    }

    // Clear all filters
    function clearAllFilters() {
        activeFilters.clear();
        applyFilters();
        updateFilterChips();
        updateFilterTrigger();
    }

    // Apply filters to notes (integrates with existing filter system)
    function applyFilters() {
        // Clear all existing filter buttons if they exist
        document.querySelectorAll('.filter-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });

        // Trigger existing filter logic by clicking buttons
        activeFilters.forEach(filterId => {
            // Split only on first dash to preserve values like '0-15' or '16-30'
            const dashIndex = filterId.indexOf('-');
            const type = filterId.substring(0, dashIndex);
            const value = filterId.substring(dashIndex + 1);

            let buttonId = null;

            if (type === 'category') {
                buttonId = `filter${value.toUpperCase()}`;
            } else if (type === 'class') {
                buttonId = `filterClass${value}`;
            } else if (type === 'time') {
                if (value === '0-15') buttonId = 'filterTime15';
                else if (value === '16-30') buttonId = 'filterTime30';
                else if (value === '31-60') buttonId = 'filterTime60';
                else if (value === '60+') buttonId = 'filterTime60Plus';
            } else if (type === 'priority') {
                buttonId = `filterPriority${value}`;
            } else if (type === 'day') {
                if (value === 'unassigned') buttonId = 'filterDayUnassigned';
                else if (value === 'monday') buttonId = 'filterDayMon';
                else if (value === 'tuesday') buttonId = 'filterDayTue';
                else if (value === 'wednesday') buttonId = 'filterDayWed';
                else if (value === 'thursday') buttonId = 'filterDayThu';
                else if (value === 'friday') buttonId = 'filterDayFri';
                else if (value === 'saturday') buttonId = 'filterDaySat';
                else if (value === 'sunday') buttonId = 'filterDaySun';
            }

            if (buttonId) {
                const btn = document.getElementById(buttonId);
                if (btn) {
                    if (!btn.classList.contains('active')) {
                        console.log('Clicking filter button:', buttonId, type, value);
                        btn.click();
                    }
                } else {
                    console.warn('Filter button not found:', buttonId, type, value);
                }
            }
        });

        // If no filters, clear all
        if (activeFilters.size === 0) {
            const clearBtn = document.getElementById('clearFilters');
            if (clearBtn && clearBtn.style.display !== 'none') {
                clearBtn.click();
            }
        }
    }

    // Update filter chips display
    function updateFilterChips() {
        if (activeFilters.size === 0) {
            filterChipsBar.style.display = 'none';
            return;
        }

        filterChipsBar.style.display = 'flex';

        const chips = Array.from(activeFilters).map(filterId => {
            // Split only on first dash
            const dashIndex = filterId.indexOf('-');
            const type = filterId.substring(0, dashIndex);
            const value = filterId.substring(dashIndex + 1);

            const def = filterDefinitions.find(f => f.type === type && f.value === value);
            if (!def) return '';

            const chipClass = `filter-chip-${type === 'category' ? value : type}`;
            return `
                <div class="filter-chip ${chipClass}">
                    ${def.key}
                    <button class="filter-chip-remove" data-filter-id="${filterId}">×</button>
                </div>
            `;
        }).join('');

        filterChipsContainer.innerHTML = chips;

        // Add remove handlers
        document.querySelectorAll('.filter-chip-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filterId = btn.dataset.filterId;
                // Split only on first dash
                const dashIndex = filterId.indexOf('-');
                const type = filterId.substring(0, dashIndex);
                const value = filterId.substring(dashIndex + 1);
                toggleFilter(type, value);
            });
        });
    }

    // Update filter trigger button
    function updateFilterTrigger() {
        const count = activeFilters.size;
        const span = document.getElementById('filterActiveCount');

        if (count === 0) {
            span.textContent = 'Filter';
            filterPaletteTrigger.classList.remove('has-active');
        } else {
            span.textContent = `${count} aktiv`;
            filterPaletteTrigger.classList.add('has-active');
        }
    }

    // Event listeners
    filterPaletteTrigger?.addEventListener('click', openFilterPalette);

    filterPalette?.querySelector('.filter-palette-overlay')?.addEventListener('click', closeFilterPalette);

    filterPaletteInput?.addEventListener('input', (e) => {
        renderSuggestions(e.target.value);
    });

    filterPaletteInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFilterPalette();
        }
    });

    // Keyboard shortcut: /
    document.addEventListener('keydown', (e) => {
        // Only trigger if not in input/textarea (except plan editor)
        const inInput = e.target.matches('input, textarea');
        const inPlanEditor = e.target.id === 'planEditor';

        if (e.key === '/' && !inInput && !inPlanEditor) {
            e.preventDefault();
            openFilterPalette();
        }
    });

    // ============================================
    // HEADER VIEW NAME UPDATE
    // ============================================

    const headerViewName = document.getElementById('headerViewName');
    const headerMeta = document.getElementById('headerMeta');
    const viewSwitchBtn = document.getElementById('viewSwitchBtn');

    // Update view name when switching views
    function updateHeaderViewName() {
        const planView = document.getElementById('planView');
        const calendarView = document.getElementById('calendarView');
        const notesCanvas = document.getElementById('notesCanvas');

        if (planView && planView.style.display !== 'none') {
            headerViewName.textContent = 'PLAN';
        } else if (calendarView && calendarView.style.display !== 'none') {
            headerViewName.textContent = 'KALENDER';
        } else {
            // Board view - check if Stack View is active
            if (window.app && window.app.stackViewActive) {
                headerViewName.textContent = 'BOARD (STACK VIEW)';
                headerViewName.style.color = '#7FDBDA'; // Cyan color to indicate different mode
            } else {
                headerViewName.textContent = 'BOARD';
                headerViewName.style.color = '#2ecc71'; // Green (default)
            }
        }
    }

    // Watch for view changes
    viewSwitchBtn?.addEventListener('click', () => {
        setTimeout(updateHeaderViewName, 50);
    });

    // Initial update
    setTimeout(updateHeaderViewName, 100);

    // ============================================
    // HEADER WORK SECTION (Timer in header)
    // ============================================
    // Now handled by app.js directly (no observer needed)

    // ============================================
    // SESSION SUMMARY MODAL
    // ============================================

    const sessionSummaryModal = document.getElementById('sessionSummaryModal');
    const sessionSummaryClose = document.getElementById('sessionSummaryClose');

    sessionSummaryClose?.addEventListener('click', () => {
        sessionSummaryModal.style.display = 'none';
    });

    sessionSummaryModal?.querySelector('.session-summary-overlay')?.addEventListener('click', () => {
        sessionSummaryModal.style.display = 'none';
    });

    // ============================================
    // INPUT MODAL (triggered by 'n' key)
    // ============================================

    const inputModal = document.getElementById('inputModal');
    const noteInput = document.getElementById('noteInput');

    function openInputModal() {
        inputModal.style.display = 'flex';
        noteInput.value = '';
        noteInput.focus();
    }

    function closeInputModal() {
        inputModal.style.display = 'none';
        noteInput.value = '';
    }

    // Click overlay to close
    inputModal?.querySelector('.input-modal-overlay')?.addEventListener('click', closeInputModal);

    // Keyboard shortcut: 'n' key
    document.addEventListener('keydown', (e) => {
        // Only trigger if not in input/textarea/contenteditable
        const inInput = e.target.matches('input, textarea') || e.target.isContentEditable;

        if (e.key === 'n' && !inInput && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            openInputModal();
        }

        // ESC to close modal
        if (e.key === 'Escape' && inputModal.style.display === 'flex') {
            closeInputModal();
        }
    });

    // Expose functions for app.js to call
    window.UI_REDESIGN = {
        updateHeaderViewName,
        openFilterPalette,
        closeFilterPalette,
        openInputModal,
        closeInputModal,
        showSessionSummary: () => {
            sessionSummaryModal.style.display = 'flex';
        }
    };

})();
