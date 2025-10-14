# Simple Notes App - Entwicklungsdokumentation

## Projektübersicht

Eine minimalistische Notizen- und Todo-Management-Anwendung mit Terminal-inspiriertem Design. Die App wurde vollständig mit Claude Code entwickelt und bietet fortgeschrittene Features wie Karten-Stacking, Zeiterfassung und Kategorisierung.

## Technische Architektur

### Dateien
```
simplenotesapp/
├── index.html          # HTML-Struktur
├── style.css           # Komplettes Styling
├── app.js             # Gesamte App-Logik
├── README.md          # Englische Dokumentation
└── claude.md          # Diese Datei (Deutsch)
```

### Technologie-Stack
- **Pure Vanilla JavaScript** - Keine Frameworks oder Dependencies
- **CSS Grid** - Responsive Layout für Karten
- **LocalStorage API** - Persistente Datenspeicherung
- **HTML5 Drag & Drop API** - Für Karten-Interaktion

## Datenmodell

### Note Object
```javascript
{
    id: Number,              // Timestamp-basierte ID
    content: String,         // Notizinhalt (bereinigt)
    timestamp: String,       // ISO-Format Erstellungszeit
    completed: Boolean,      // Immer false (wird gelöscht statt completed)
    stackId: Number|null,    // ID des Stacks oder null
    category: String|null,   // 'k', 'h', 'p', 'u' oder null
    uClass: String|null,     // Klassen-Tag für 'u': '2a', '2b', '2c', '3a', '3b', '5'
    timeMinutes: Number|null,// Zeitangabe in Minuten
    priority: String|null,   // '!', '!!', oder '!!!' für Prioritäten
    focused: Boolean,        // Scharfgestellt für aktive Aufgaben
    assignedDay: String|null // 'monday' - 'sunday' oder null für Kanban
}
```

### Stack Object
```javascript
{
    id: Number,              // Timestamp-basierte ID
    noteIds: Array<Number>,  // Array von Note-IDs im Stack
    type: String,            // 'group' oder 'sequential'
    title: String|null       // Optionaler Stack-Titel
}
```

## Haupt-Features

### 1. Plan View - Minimalistisches Notepad (NEUESTES!)

Ein typewriter-inspirierter Editor für Tagesplanung mit automatischer Task-Erstellung.

**UI/UX**:
- Vollbild schwarzer Hintergrund
- Zentrierter contenteditable Editor (80% Breite, max 900px)
- Courier New Schriftart, 18px, Zeilenhöhe 1.8
- Blinkender Cursor
- Scroll-Padding (40px) verhindert Überlappung mit Header/Footer

**Live Markdown Rendering**:
- **Cmd+B**: Macht Text **fett** (via `document.execCommand('bold')`)
- **Cmd+I**: Macht Text *kursiv* (via `document.execCommand('italic')`)
- **Cmd+Shift+8**: Bullet-Liste (via `document.execCommand('insertUnorderedList')`)
- **Cmd+Shift+C**: Interaktive Checkbox einfügen
- Checkboxen sind klickbare HTML-Elemente (nicht Markdown-Syntax)

**Automatische Task-Erstellung**:
- Pattern: `(Task-Name 30m --k !!)`
- Regex: `/\(([^)]+?)\)/g`
- Parsing-Reihenfolge:
  1. Kategorie: `--u2a` (mit Klasse) oder `--k/h/p`
  2. Priorität: `!`, `!!`, `!!!`
  3. Zeit: `\d+m`
- Nach Erstellung: `()` wird zu grünem `[...] ✓`
- Cursor bewegt sich automatisch aus dem grünen Span

**Implementierung** (app.js:2630-2803):
```javascript
handlePlanInput() {
    const text = this.getPlainText(); // Extrahiert Plain-Text aus HTML
    const taskPattern = /\(([^)]+?)\)/g;
    const matches = [...text.matchAll(taskPattern)];

    matches.forEach(match => {
        // Parse category, priority, time
        // Create note object
        // Replace () with green [✓]
        // Move cursor outside green span
    });
}

getPlainText() {
    // Clone editor
    // Replace checkboxes with markdown: [ ] oder [x]
    // Return textContent
}

insertCheckbox() {
    // Creates HTML: <span class="task-item"><input type="checkbox" class="task-checkbox"></span>
    // Inserts at cursor position
}
```

**Persistenz**:
- localStorage Key: `'planText'`
- Speichert: `this.planEditor.innerHTML` (als HTML, nicht Plain-Text!)
- Lädt beim Init via `loadPlanText()`

**CSS-Besonderheiten** (style.css:857-966):
```css
.plan-editor {
    contenteditable: true;
    height: calc(100vh - 240px);
    padding: 40px 0;
    scroll-padding-top/bottom: 40px;
}

.plan-editor strong { font-weight: 700; color: #fff; }
.plan-editor em { font-style: italic; color: #ccc; }
.plan-editor ul { padding-left: 20px; list-style-type: disc; }

.task-checkbox {
    appearance: none;
    width: 16px; height: 16px;
    border: 1px solid #666;
    border-radius: 3px;
}

.task-checkbox:checked {
    background-color: #2ecc71;
}
```

**View-Switching**:
- Button-Zyklus: Board (⊟) → Kanban (✎) → Plan (⊞) → Board
- Bei Wechsel zu Plan: `setTimeout(() => this.planEditor.focus(), 100)`

### 2. Session-Statistik & Zeiterfassung (NEU!)

**Session Statistics** im Header:
- Nach Beenden einer Work-Session werden Zeitdaten im localStorage gespeichert
- Key: `'lastSessionData'`
- Struktur: `{ plannedMinutes, actualMinutes, differenceMinutes, timestamp }`

**Anzeige im Header**:
- **Gespart: +15m** (grün) wenn schneller
- **Mehr: -10m** (rot) wenn langsamer
- **Genau: ±0m** (türkis) wenn exakt
- CSS-Klassen: `.time-stat.session-stat.faster/slower/exact`

**Implementierung** (app.js:512-575, 1640-1660):
```javascript
showSessionSummary(timerRanOut) {
    // Calculate elapsed time
    const sessionData = {
        plannedMinutes,
        actualMinutes,
        differenceMinutes,
        timestamp: Date.now()
    };
    localStorage.setItem('lastSessionData', JSON.stringify(sessionData));
    this.updateTimeStats(); // Re-renders header
}

updateTimeStats() {
    // ... normal stats ...
    const sessionDataStr = localStorage.getItem('lastSessionData');
    if (sessionDataStr) {
        const data = JSON.parse(sessionDataStr);
        if (data.differenceMinutes > 0) {
            html += `<div class="time-stat session-stat faster">...`;
        }
    }
}
```

**Fix: updateWorkSidebar**:
- Problem: Stoppt automatisch Timer wenn keine fokussierten Tasks
- Lösung: Kommentar hinzugefügt, `stopWork()` entfernt
- Jetzt übernimmt `recalculateTimer()` die Steuerung

### 3. Prioritäten-System (NEU!)

**Syntax**: `!`, `!!`, `!!!`

**Parsing** (addNote & handlePlanInput):
```javascript
const priorityMatch = content.match(/(!{1,3})/);
if (priorityMatch) {
    priority = priorityMatch[1]; // WICHTIG: Als String speichern!
    content = content.replace(/!{1,3}/, '').trim();
}
```

**Rendering**:
```javascript
if (note.priority) {
    const priorityDisplay = document.createElement('span');
    priorityDisplay.className = 'note-priority';
    priorityDisplay.textContent = note.priority; // '!', '!!', oder '!!!'
    leftActions.appendChild(priorityDisplay);
}
```

**CSS**:
```css
.note-priority {
    color: #ff4444;
    font-weight: bold;
    margin-left: 6px;
}
```

**Bug-Fix**: Im Plan-Modus wurde Priorität als Zahl gespeichert → jetzt als String

### 4. Unterrichts-Kategorie mit Klassen-Tags (NEU!)

**Syntax**: `--u2a`, `--u2b`, `--u2c`, `--u3a`, `--u3b`, `--u5`

**Parsing** (addNote):
```javascript
const uCategoryMatch = content.match(/--u(2a|2b|2c|3a|3b|5)$/);
if (uCategoryMatch) {
    category = 'u';
    uClass = uCategoryMatch[1]; // '2a', '2b', etc.
    content = content.replace(/\s*--u(2a|2b|2c|3a|3b|5)$/, '').trim();
}
```

**Rendering**:
```javascript
if (note.category === 'u' && note.uClass) {
    const classBadge = document.createElement('span');
    classBadge.className = 'class-badge';
    classBadge.textContent = note.uClass; // '2a', '3b', etc.
    classBadge.style.backgroundColor = '#B19CD9';
    centerActions.appendChild(classBadge);
}
```

**Filter-Integration**:
- Filter-Buttons: `filterClass2a`, `filterClass2b`, etc.
- Filter-Keys: `'class-2a'`, `'class-2b'`, etc.
- Matching: `return note.category === 'u' && note.uClass === cls;`

### 5. Completed Counter (NEU!)

**Funktion**: Zählt erledigte Tasks pro Tag

**Properties**:
```javascript
this.completedToday = 0;
this.lastResetDate = null;
this.completedCounterElement = document.getElementById('completedCounter');
```

**Persistenz**:
```javascript
saveCompletedCounter() {
    const data = {
        count: this.completedToday,
        date: new Date().toDateString()
    };
    localStorage.setItem('completedCounter', JSON.stringify(data));
}

loadCompletedCounter() {
    const saved = localStorage.getItem('completedCounter');
    if (saved) {
        const data = JSON.parse(saved);
        this.completedToday = data.count;
        this.lastResetDate = data.date;
    }
}
```

**Auto-Reset bei Mitternacht**:
```javascript
checkAndResetCounter() {
    const today = new Date().toDateString();
    if (this.lastResetDate && this.lastResetDate !== today) {
        this.completedToday = 0;
        this.saveCompletedCounter();
    }
}
```

**Increment nur bei Complete**:
```javascript
toggleComplete(id) {
    // ...
    this.completedToday++;
    this.saveCompletedCounter();
    this.updateCompletedCounter();
}
```

**Nicht** bei Delete!

### 6. Karten bearbeiten
Bestehende Karten können bearbeitet werden:

**UI**:
- Dreipunkte-Button (⋮) öffnet Edit-Modus
- Content wird contenteditable
- Enter speichert, ESC bricht ab

**Implementierung** (app.js:126-271):
```javascript
enterEditMode(id) {
    // Speichert Original-Werte (_originalContent, _originalCategory, _originalTime)
    // Zeigt Content + Zeit + Kategorie im editierbaren Format
    // Keyboard: Enter → saveEdit(), ESC → cancelEdit()
}

saveEdit(id) {
    // Nutzt gleiche Parsing-Logik wie addNote()
    // Extrahiert Kategorie (--k/h/p) und Zeit (\d+m)
    // Updated note-Object und speichert
}
```

**Wichtig**: Die Parsing-Reihenfolge (erst Kategorie, dann Zeit) ist identisch zu `addNote()`.

### 2. Stack Modal (NEU)
Klick auf Stack öffnet Modal zur Verwaltung:

**Features**:
- Badge zeigt Anzahl Karten (z.B. "3 cards")
- Modal listet alle Karten vertikal auf
- **Reordering**: ↑↓ Buttons verschieben Karten (kein Drag & Drop mehr)
- **Unstack**: ⇢ Button entfernt Karte aus Stack
- Alle Actions funktionieren: Edit (⋮), Delete (×), Complete (○)

**Implementierung** (app.js:273-300, 468-499, 638-952):
```javascript
openStackModal(stackId) {
    // Lädt Stack, rendert Karten mit createModalCard()
    // Übergibt isFirst/isLast für disabled State der Pfeile
}

createModalCard(note, isFirst, isLast) {
    // Separater Render für Modal-Karten
    // Fügt ↑↓ Buttons hinzu (disabled wenn erste/letzte)
    // Fügt ⇢ Unstack-Button hinzu
}

moveCardUp(noteId) / moveCardDown(noteId) {
    // Swapped Position im stack.noteIds Array
    // Speichert und refresht Modal
}

unstackNote(noteId) {
    // Entfernt Note aus Stack
    // Löst Stack auf wenn nur 1 Karte übrig
}
```

**CSS** (style.css:394-560):
- Modal: Fixed overlay mit Blur-Effekt
- Fade-In Animation (scale 0.95 → 1)
- Badge: Absolut positioniert, top-right
- Arrow Buttons: Disabled State mit opacity 0.3

**Close-Optionen**:
- X-Button (stack-modal-close)
- Klick auf Overlay
- ESC-Taste (globaler Event-Listener)

### 3. Eingabe-Parsing
Die `addNote()` Methode parst Benutzereingaben in dieser Reihenfolge:

1. **Kategorie-Tag** (`--k`, `--h`, `--p`) - wird zuerst entfernt
2. **Zeitangabe** (`\d+m`) - wird danach entfernt
3. **Content** - verbleibender Text

**Wichtig:** Reihenfolge ist kritisch! Kategorie muss zuerst geparst werden.

Beispiel:
```
Input: "Meeting vorbereiten 30m --k"
→ category: "k"
→ timeMinutes: 30
→ content: "Meeting vorbereiten"
```

### 4. Stacking-System

#### Erstellung
- Drag-Event auf Karte A startet
- Drop auf Karte B erstellt Stack oder fügt zu bestehendem hinzu
- Stack-Logik in `handleDrop()`:
  ```javascript
  if (target has stackId) → add to existing
  else if (dragged has stackId) → add target to existing
  else → create new stack
  ```

#### Rendering
- Stacks werden vor einzelnen Karten gerendert
- Karten in Stack bekommen `stacked` CSS-Klasse
- CSS-Variable `--stack-index` steuert vertikalen Offset
- Letzte Karte im Array = oberste Karte (höchster z-index)

### 5. Zeit-Berechnung

#### Einzelne Karte
```javascript
timeDisplay.textContent = `${note.timeMinutes}m`;
```

#### Stack (nur Top-Karte)
```javascript
const totalTime = stackNotes.reduce((sum, note) =>
    sum + (note.timeMinutes || 0), 0
);
// Anzeige in weißer Farbe
```

#### Header-Statistiken
```javascript
updateTimeStats() {
    // Iteriert durch alle notes
    // Gruppiert nach category (k, h, p, none)
    // Berechnet total
    // Rendert nur vorhandene Kategorien
}
```

### 6. Animation-System

#### Fade-In (neue Karten)
```css
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
```

#### Fade-Out (löschen/erledigen)
1. CSS-Klasse `removing` wird hinzugefügt
2. Animation läuft 300ms
3. `setTimeout` entfernt Karte aus Array
4. Re-render

### 7. Farbsystem

Pastel-Farben für Kategorien:
```css
--k: #7FDBDA  /* Türkis */
--h: #FFD966  /* Gelb */
--p: #FF7B7B  /* Rot */
```

Implementierung via CSS Custom Properties:
```css
.note-card {
    --card-color: #333;  /* default */
    /* border via repeating-linear-gradient */
}

.note-card[data-category="k"] {
    --card-color: #7FDBDA;
}
```

## CSS-Besonderheiten

### Gestrichelte Border
Statt `border: 1px dashed`:
```css
background-image:
    repeating-linear-gradient(0deg, var(--card-color) 0px,
        var(--card-color) 10px, transparent 10px, transparent 16px),
    /* ... 4 Seiten ... */
background-size: 2px 100%, 100% 2px, 2px 100%, 100% 2px;
```

Vorteil: Gestrichelter Rand mit CSS-Variables kombinierbar.

### 8. Button-Layout (Aktualisiert)

**Normale Karten**:
```
Left:  × | Zeit
Right: ○ | ⋮
```

**Modal-Karten**:
```
Left:  × | Zeit | ↑ | ↓
Right: ⇢ | ○ | ⋮
```

Button-Funktionen:
- **×** - Löschen
- **Zeit** - Anzeige (nicht klickbar)
- **↑↓** - Reordering (nur im Modal, disabled bei erster/letzter)
- **⇢** - Unstack (nur im Modal)
- **○** - Complete/Erledigen
- **⋮** - Edit-Menü

### Stack-Offset
```css
.stacked {
    transform: translateY(calc(var(--stack-index) * 6px));
    z-index: var(--stack-index);
}
```

Höherer Index = weiter unten + höherer z-index = visuell oben.

## LocalStorage

### Speicherung
```javascript
saveNotes() {
    localStorage.setItem('simpleNotes', JSON.stringify(this.notes));
}

saveStacks() {
    localStorage.setItem('simpleStacks', JSON.stringify(this.stacks));
}
```

### Laden
```javascript
loadNotes() {
    const saved = localStorage.getItem('simpleNotes');
    if (saved) this.notes = JSON.parse(saved);

    const savedStacks = localStorage.getItem('simpleStacks');
    if (savedStacks) this.stacks = JSON.parse(savedStacks);
}
```

## Event-Handling

### Drag & Drop
```javascript
card.draggable = true;
card.addEventListener('dragstart', (e) => this.handleDragStart(e, note.id));
card.addEventListener('dragend', (e) => this.handleDragEnd(e));
card.addEventListener('dragover', (e) => this.handleDragOver(e));
card.addEventListener('dragenter', (e) => this.handleDragEnter(e, note.id));
card.addEventListener('dragleave', (e) => this.handleDragLeave(e));
card.addEventListener('drop', (e) => this.handleDrop(e, note.id));
```

### Keyboard
```javascript
noteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') → addNote()
    if (e.key === 'Escape') → clear input
});
```

## Neue Features

### 1. Kanban-Ansicht
Wochenplanung mit Drag & Drop zwischen Tagen:

**Struktur**:
- 8 Spalten: "Nicht zugewiesen" + Montag-Sonntag
- Spalten-Header mit Karten-Count und Zeit-Total
- Separate Render-Methode `renderKanban()`

**Implementierung**:
```javascript
renderKanban() {
    // Iteriert durch alle Tage
    // Gruppiert Karten nach assignedDay
    // Rendert Stacks und einzelne Karten pro Spalte
    // Berechnet Zeit-Total (nur Top-Karten bei Stacks)
}

handleKanbanDrop(e, day) {
    // Weist Karte oder ganzen Stack einem Tag zu
    // draggedCard → einzelne Karte
    // draggedStack → gesamter Stack
}
```

**Besonderheiten**:
- Filter: Zeit/Kategorie aktiv, Tag-Filter ignoriert
- Stacks: Wenn alle Karten gleichen Tag haben → als Stack rendern
- Zeit-Berechnung: Nur oberste Karte in Stacks zählt
- View-Switch: Button im Header wechselt zwischen Board/Kanban

### 2. Filter-System
Multi-Dimension-Filterung:

**Filter-Typen**:
```javascript
// Kategorie
'category-k', 'category-h', 'category-p'

// Zeit
'time-0-15', 'time-16-30', 'time-31-60', 'time-60+'

// Tag (nur Board-Ansicht)
'day-unassigned', 'day-monday', ..., 'day-sunday'
```

**Logik**:
```javascript
getFilteredNotes() {
    // Sequential Stacks: Nur Top-Karte aktiv
    // Kategorie: OR-Verknüpfung zwischen aktiven Filtern
    // Zeit: OR-Verknüpfung zwischen aktiven Filtern
    // Tag: OR-Verknüpfung (nur in Board)
    // Zwischen Typen: AND-Verknüpfung
}

getFilteredNotesForKanban() {
    // Wie getFilteredNotes() aber ohne Tag-Filter
}
```

### 3. Focus/Work-Timer
Fokussierte Aufgaben mit Timer:

**Features**:
- Button (•) markiert Karte als `focused`
- Sidebar erscheint mit Gesamt-Zeit fokussierter Karten
- Countdown-Timer für Work-Sessions
- Visuelle Hervorhebung (Kategorie-Farbe als Hintergrund)

**Implementierung**:
```javascript
toggleFocus(id) {
    note.focused = !note.focused;
    this.updateWorkSidebar();
}

updateWorkSidebar() {
    // Berechnet Zeit aller focused=true Karten
    // Zeigt/versteckt Sidebar
}
```

### 4. Stack-Typen
Zwei Workflow-Arten:

**Group (+)**:
- Alle Karten aktiv
- Gemeinsame Kategorie-Sammlung
- Zeit: Summe aller Karten

**Sequential (→)**:
- Nur oberste Karte aktiv
- Workflow mit Reihenfolge
- Blocked-Karten ausgegraut + ⊠ Wasserzeichen
- Filter zeigen nur aktive Karte

**Toggle**:
```javascript
// Im Stack-Modal
stackTypeBtn.addEventListener('click', () => {
    stack.type = stack.type === 'group' ? 'sequential' : 'group';
    this.updateStackTypeButton(stack.type);
});
```

### 5. Automatisches Backup
File System Access API (Chrome):

**Funktionen**:
- Ordner-Auswahl mit `showDirectoryPicker()`
- Auto-Backup alle 5 Minuten
- IndexedDB speichert Folder-Handle persistent
- Export/Import als JSON

**Implementierung**:
```javascript
async selectBackupFolder() {
    const dirHandle = await window.showDirectoryPicker();
    await this.saveFolderHandle(dirHandle);
    this.startAutoBackup();
}

async saveFolderHandle(handle) {
    // IndexedDB: 'backupSettings' store
    // Permissions prüfen bei Restore
}
```

## Wichtige Implementierungsdetails

### 1. Stack-Cleanup
Beim Löschen/Erledigen einer Karte:
```javascript
// Entferne Note-ID aus allen Stacks
this.stacks.forEach(stack => {
    stack.noteIds = stack.noteIds.filter(id => id !== noteId);
});

// Entferne leere Stacks
this.stacks = this.stacks.filter(stack => stack.noteIds.length > 0);
```

### 2. Render-Logik
```javascript
render() {
    1. Update note count
    2. Update time stats
    3. Clear canvas
    4. Render stacks (mit allen Karten)
    5. Render einzelne Karten (nicht in Stacks)
}
```

Wichtig: `renderedNotes` Set verhindert doppeltes Rendering.

### 3. Completed vs Deleted
Es gibt keinen "completed" State mehr. Der Kreis-Button (○) entfernt die Karte komplett:
```javascript
toggleComplete(id) {
    // Animiert und löscht Karte
    // Nicht: note.completed = true
}
```

### 4. Edit-Modus State Management
Original-Werte werden temporär im Note-Object gespeichert:
```javascript
note._originalContent = note.content;
note._originalCategory = note.category;
note._originalTime = note.timeMinutes;

// Bei Cancel: Restore
// Bei Save: Delete temporary properties
```

### 5. Modal Refresh Pattern
Modal wird nach jeder Aktion komplett neu gerendert:
```javascript
// Nach Edit, Delete, Move, Unstack
this.openStackModal(this.currentStackId);
```
Vorteil: State bleibt konsistent, disabled States werden neu berechnet.

## Design-Entscheidungen

### Warum keine Frameworks?
- Minimale Dependencies
- Volle Kontrolle über Performance
- Einfaches Deployment (nur 3 Dateien)
- Lernressource für Vanilla JS

### Warum LocalStorage?
- Keine Backend-Infrastruktur nötig
- Instant Persistenz
- Privacy (Daten bleiben lokal)
- Limitierung: ~5-10MB pro Domain

### ~~Warum keine Bearbeitung?~~ (Implementiert!)
Bearbeitung ist jetzt verfügbar via Dreipunkte-Menü (⋮):
- Nutzt contenteditable für In-Place-Editing
- Gleiche Parsing-Logik wie bei Erstellung
- Temporäre Speicherung ermöglicht Cancel-Funktionalität

## Erweiterungsmöglichkeiten

### Geplante Features (Priorität)

#### 1. Aktive Karten-Auswahl
Karten können als "aktiv" markiert werden für gezieltes Tracking:
- **Selektion**: Checkbox oder Toggle zum Aktivieren
- **Benutzerdefinierte Reihenfolge**: Drag & Drop für aktive Karten
- **Gefilterte Zeit-Anzeige**: Header zeigt nur Zeit der aktiven Karten
- **Tag-Planung**: Datum/Deadline für aktive Karten setzen
- **Fokus-Modus**: Nur aktive Karten anzeigen

Implementierung:
```javascript
note.active = false  // Neues Property
note.activeOrder = null  // Position in Aktiv-Liste
note.deadline = null  // Optional: ISO-Datum
```

#### 2. Pomodoro-Timer
Integrierter Timer für fokussiertes Arbeiten:
- **25/5 Minuten**: Standard Pomodoro (25 min Arbeit, 5 min Pause)
- **Karten-Integration**: Timer an Karte koppeln
- **Session-Tracking**: Anzahl abgeschlossener Pomodoros pro Karte
- **Automatische Pausen**: Short Break (5 min), Long Break (15 min nach 4 Sessions)
- **Browser-Notifications**: Sounds + Desktop-Benachrichtigung
- **Zeit-Logging**: Tatsächliche Zeit vs. geschätzte Zeit

Implementierung:
```javascript
note.pomodorosCompleted = 0
note.actualTimeSpent = 0  // in Minuten

// Timer-State (global)
this.timer = {
    running: false,
    remainingSeconds: 0,
    currentNoteId: null,
    type: 'work' | 'shortBreak' | 'longBreak'
}
```

### Weitere Mögliche Features
1. **Export/Import** - JSON-Export für Backup
2. **Suche** - Filter nach Content/Kategorie
3. **Sortierung** - Nach Zeit, Kategorie, Erstelldatum
4. **Tags** - Flexiblere Kategorisierung als --k/h/p
5. **Subtasks** - Nested Todos in Karten
6. **Reminder** - Browser-Notifications
7. **Themes** - Light Mode, Custom Colors
8. **Sync** - Cloud-Backup via API

### Code-Verbesserungen
1. **TypeScript** - Type Safety
2. **Module System** - ESM mit Bundler
3. **Testing** - Jest/Vitest Unit Tests
4. **State Management** - Klarer State-Flow
5. **Accessibility** - ARIA-Labels, Keyboard-Nav

## Performance

### Optimierungen
- Keine Re-Renders während Drag
- CSS-Animationen (Hardware-beschleunigt)
- Event-Delegation wo möglich
- LocalStorage nur bei Änderungen

### Limitierungen
- Max ~1000 Karten empfohlen
- LocalStorage-Limit beachten
- Keine Virtualisierung bei vielen Karten

## Browser-Kompatibilität

### Getestet auf
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

### Benötigte APIs
- LocalStorage
- IndexedDB (für Backup-Settings)
- File System Access API (Chrome, für Backup)
- CSS Grid
- CSS Custom Properties
- Drag & Drop API
- ES6+ JavaScript

## Entwicklung mit Claude

Dieses Projekt wurde vollständig mit **Claude Code** entwickelt - einem AI-powered Terminal Tool von Anthropic.

### Entwicklungsprozess
1. Terminal-inspiriertes Design als Ausgangspunkt
2. Iterative Feature-Entwicklung
3. Responsive CSS-Anpassungen
4. Debugging und Optimierungen
5. Vollständige Dokumentation

### Lessons Learned
- **Parsing-Reihenfolge ist kritisch**: Kategorie vor Zeit, sonst Konflikte
- **CSS Variables für dynamische Farben**: Ermöglicht flexible Kategorie-Farbgebung
- **LocalStorage braucht aktive Cleanup-Logik**: Empty stacks müssen entfernt werden
- **Animations-Timing wichtig für UX**: 300ms für Fade-Out, dann DOM-Operation
- **Edit via contenteditable**: Einfacher als Input-Overlay, nutzt existierendes DOM
- **Modal statt Inline-Management**: Klarer für komplexe Interaktionen (Reorder, Unstack)
- **Buttons > Drag & Drop**: ↑↓ Buttons intuitiver als Drag & Drop für Reordering
- **Disabled State wichtig**: Verhindert ungültige Operationen (erste/letzte Karte)
- **Z-Index Konflikte vermeiden**: Stack-Badge links statt rechts verhindert Button-Überlappung
- **Event-Listener-Duplikation verhindern**: Flag-Variable für einmalige Registrierung in Render-Loops
- **View-Separation wichtig**: Separate Render-Methoden (renderBoard/renderKanban) vermeiden Komplexität
- **Filter-Logik trennen**: Kanban ignoriert Tag-Filter, behält aber Zeit/Kategorie-Filter
- **Button-Klicks vor Drag schützen**: `e.preventDefault()` + `draggable=false` auf Buttons
- **IndexedDB für komplexe Daten**: File-Handles brauchen strukturierte Speicherung
- **Tab-Key problematisch**: Dedicated Button besser als Tab-Switching bei vielen interaktiven Elementen
- **ContentEditable für Rich Text**: Native `document.execCommand()` für Bold/Italic besser als Markdown-Parsing
- **HTML-Storage statt Plain-Text**: Plan-Editor speichert innerHTML, nicht textContent, um Formatierung zu bewahren
- **Cursor-Management wichtig**: Nach Auto-Task-Erstellung Cursor aus grünem Span bewegen, sonst schreibt User grün weiter
- **Scroll-Padding notwendig**: `scroll-padding-top/bottom` verhindert, dass Text unter Header/Footer verschwindet
- **Priorität als String speichern**: `'!!'` nicht als Zahl, sonst wird es zu "2" gerendert
- **updateWorkSidebar-Bug**: Nicht automatisch Timer stoppen, sonst race condition mit `recalculateTimer()`
- **Session-Stats persistent**: localStorage macht Stats sichtbar auch wenn Sidebar geschlossen
- **--u Parsing vor anderen Kategorien**: `--u2a` muss vor `--k/h/p` geparst werden, um Klasse zu erkennen

## Zukünftige Features & Ideen

### Priorisierte Feature-Liste

#### 1. 📈 Statistics/Analytics Dashboard ⭐⭐⭐⭐⭐
**Nutzen:** Visualisierung bereits getrackerter Daten (Zeit, Kategorien, erledigte Tasks)

**Implementierung:**
- Neuer View "Stats" (4. Ansicht im View-Cycle)
- Visualisierungen:
  - Zeit pro Kategorie diese Woche (Balkendiagramm)
  - Erledigte Tasks pro Tag (Trend-Linie)
  - Durchschnittliche Task-Zeit pro Kategorie
  - Zeit-Verteilung nach Klassen (2a vs 2b vs 2c)
  - Geplant vs. Tatsächlich über Zeit (Session Stats)
- LocalStorage für historische Daten

**Beispiel:**
```
KSWIL: 12h diese Woche (↑ 2h vs. letzte Woche)
HSLU: 8h
Unterricht: 15h
  - 2a: 5h
  - 2b: 4h
  - 3a: 6h
```

#### 2. 📅 Deadlines/Fälligkeitsdaten ⭐⭐⭐⭐⭐
**Nutzen:** Abgabetermine, Prüfungstermine tracking

**Implementierung:**
- Syntax: `Task 30m --k @2025-10-20` oder `@Fr` (nächster Freitag)
- Visuelle Hinweise:
  - Überfällig: roter Border
  - Heute fällig: gelber Border
  - Diese Woche: Datum-Badge
- Kanban: Auto-assign basierend auf Deadline
- Sortierung: Deadlines zuerst
- Note-Property: `deadline: Date|null`

#### 3. 🔁 Recurring Tasks ⭐⭐⭐⭐
**Nutzen:** Wiederkehrende Aufgaben (Korrekturen, Meetings, Unterrichtsvorbereitung)

**Implementierung:**
- Syntax: `Task 60m --u2a @Mo,Mi,Fr` oder `@weekly`
- Nach Complete: Automatisch neu erstellen für nächsten Termin
- Note-Property: `recurring: String|null` (z.B. "weekly", "Mo,Mi,Fr")
- Template-System: Neue Task aus bestehender klonen

#### 4. 🔍 Search + Quick Filter ⭐⭐⭐⭐
**Nutzen:** Tasks schnell finden bei vielen Einträgen

**Implementierung:**
- `Cmd+F` öffnet Suchfeld im Header
- Live-Suche nach Content
- Quick-Filter Syntax: `#mathe`, `@heute`, `!urgent`
- Keyboard-Navigation: Pfeiltasten zum Springen
- Highlight-Funktion für Suchergebnisse

#### 5. 📝 Completed History ⭐⭐⭐
**Nutzen:** Überblick über erledigte Tasks statt nur Counter

**Implementierung:**
- Klick auf "X heute erledigt" → Modal öffnet
- Liste mit Timestamps
- Wiederherstellungs-Option (Undo einzelner Task)
- Zeiträume: Heute / Diese Woche / Letzte 7 Tage
- LocalStorage: `completedHistory: Array<{note, completedAt}>`

#### 6. ⌨️ Keyboard Shortcuts ⭐⭐⭐
**Nutzen:** Effizienzsteigerung für Power-User

**Vorgeschlagene Shortcuts:**
```
Cmd+N       → Neue Notiz (in aktuellem View)
Cmd+K       → Quick Command Palette
Cmd+1/2/3/4 → View wechseln (Board/Kanban/Plan/Stats)
Cmd+F       → Search
Cmd+,       → Settings
Cmd+S       → Speichern (Plan View)
/           → Quick Filter aktivieren
ESC         → Clear filters/close modals
```

**Implementierung:**
- Globaler Keydown-Listener mit Command-Registry
- Visual Feedback (z.B. Command Palette Modal)
- Shortcuts in Settings anzeigen

#### 7. 🎨 Visual Improvements

**Stack Titles in Board View:**
- Momentan nur im Modal sichtbar
- Kleine Badge oben auf Stack (diskret, nur bei Hover sichtbar)

**Drag & Drop Preview:**
- Ghost-Image beim Dragging
- Drop-Zone highlighting mit Farbe
- Smooth Animations

**Sequential Stack Visual:**
- Blocked Cards mehr ausgegraut (opacity: 0.4)
- ⊠ Wasserzeichen prominenter
- Klarere Unterscheidung zu Group Stacks

#### 8. 📱 Mobile/Responsive ⭐⭐⭐
**Nutzen:** Unterwegs Tasks checken und bearbeiten

**Implementierung:**
- Breakpoints: Desktop (>1024px), Tablet (768-1024px), Mobile (<768px)
- Single-Column Layout auf Phone
- Touch-friendly: Buttons mindestens 44x44px
- Swipe Gestures:
  - Swipe links → Delete
  - Swipe rechts → Complete
- Hamburger-Menu für Filter auf Mobile
- Bottom-Sheet statt Modal auf Mobile

#### 9. 🔗 Plan View: Note Linking
**Nutzen:** Verknüpfung zwischen gespeicherten Notizen

**Implementierung:**
- Syntax: `[[Notiz-Name]]` im Text
- Klickbare Links zu anderen Notizen
- Backlinks-Anzeige (welche Notizen verlinken hierhin)
- Graph-View (optional): Visualisierung der Verbindungen
- Autocomplete beim Tippen `[[`

#### 10. 💾 Better Backup/Export

**CSV Export:**
- Alle Tasks mit Zeit, Kategorie, Status, Timestamp
- Für Excel-Auswertung
- Button im Hamburger-Menü

**iCal Export:**
- Kanban-Tasks als Calendar Events
- Importierbar in Google Calendar, Apple Calendar, Outlook

**Import:**
- CSV Import für Bulk-Task-Erstellung
- Template-System: Vorlagen für wiederkehrende Workflows

### Quick Wins (wenig Aufwand, hoher Nutzen)

1. **Stack Title in Board View anzeigen** (2h)
   - Badge oben auf Stack
   - Nur bei Hover sichtbar
   - CSS-only möglich

2. **Keyboard Shortcuts** (4h)
   - Cmd+1/2/3 für View-Wechsel
   - Cmd+N für neue Notiz
   - ESC für Modal/Filter schließen

3. **Drag & Drop Visual Feedback** (2h)
   - Drop-Zone highlighting
   - Smooth ghost-image

4. **Search (Basic)** (3h)
   - Einfache Text-Suche im Header
   - Filter notes nach content

5. **Completed History Modal** (3h)
   - Erweitert bestehenden Counter
   - Liste mit Restore-Option

### Technische Verbesserungen

**Performance:**
- Virtual Scrolling bei >100 Karten
- Lazy Loading für Kanban-Spalten
- Debouncing für Live-Search

**Code-Struktur:**
- Module System (ESM) einführen
- Separate Dateien: `notes.js`, `stacks.js`, `ui.js`, `filters.js`
- TypeScript Migration (optional)

**Testing:**
- Unit Tests für Core-Logik (Vitest)
- E2E Tests für User-Flows (Playwright)
- CI/CD Pipeline (GitHub Actions)

**Accessibility:**
- ARIA-Labels für alle interaktiven Elemente
- Keyboard-Navigation überall
- Screen-Reader Support
- Focus-Management verbessern

---

## Kontakt & Beiträge

Dieses Projekt ist Open Source (MIT License). Feedback und Beiträge sind willkommen!

---

**Entwickelt mit Claude Code v2.0.14**
