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
    category: String|null,   // 'k', 'h', 'p' oder null
    timeMinutes: Number|null,// Zeitangabe in Minuten
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

### 1. Karten bearbeiten (NEU)
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

## Kontakt & Beiträge

Dieses Projekt ist Open Source (MIT License). Feedback und Beiträge sind willkommen!

---

**Entwickelt mit Claude Code v2.0.14**
