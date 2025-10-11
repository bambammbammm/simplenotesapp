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
    timeMinutes: Number|null // Zeitangabe in Minuten
}
```

### Stack Object
```javascript
{
    id: Number,              // Timestamp-basierte ID
    noteIds: Array<Number>   // Array von Note-IDs im Stack
}
```

## Haupt-Features

### 1. Eingabe-Parsing
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

### 2. Stacking-System

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

### 3. Zeit-Berechnung

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

### 4. Animation-System

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

### 5. Farbsystem

Pastel-Farben für Kategorien:
```css
--k: #7FDBDA  /* Türkis */
--h: #FFB380  /* Orange */
--p: #C7B3E5  /* Violet */
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

### Warum keine Bearbeitung?
- Fokus auf Quick Capture
- Vereinfachtes Datenmodell
- Fehlerhafte Notizen können gelöscht und neu erstellt werden

## Erweiterungsmöglichkeiten

### Mögliche Features
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
- Parsing-Reihenfolge ist kritisch (Kategorie vor Zeit)
- CSS Variables für dynamische Farben
- LocalStorage braucht aktive Cleanup-Logik
- Animations-Timing wichtig für UX

## Kontakt & Beiträge

Dieses Projekt ist Open Source (MIT License). Feedback und Beiträge sind willkommen!

---

**Entwickelt mit Claude Code v2.0.14**
