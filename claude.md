# Simple Notes App - Dev Docs

Minimalistische Todo-App mit Terminal-Design. Pure Vanilla JavaScript.

**Stack**: HTML5, CSS3, Vanilla JS, LocalStorage, Drag & Drop API

## Datenmodell

```javascript
// Note
{
    id, content, timestamp, stackId,
    category: 'k'|'h'|'p'|'u',  // Kategorien
    uClass: '2a'|'2b'|'2c'|'3a'|'3b'|'5',  // Klassen für 'u'
    timeMinutes, priority: '!'|'!!'|'!!!',
    focused, assignedDay: 'monday'...'sunday'
}

// Stack
{ id, noteIds: [], type: 'group'|'sequential', title }
```

## Wichtigste Features

### 1. UI & Navigation
- **Single-Line Header**: Kompakte Navigation mit View-Name, Filter, Timer, Stats
- **Filter Command Palette**: Tastatur-driven (Taste `/`)
  - VS Code-inspiriertes Design
  - Kategorien, Klassen, Zeit, Priorität, Tage filtern
  - Aktive Filter als Chips angezeigt (removable mit ×)
  - Suggestions mit Realtime-Suche
- **Input Modal**: Neue Notes erstellen (Taste `n`)
  - Zentriertes Modal statt always-visible Input
  - 3-zeilige Textarea mit Terminal-Prompt `>`
  - Completed Counter im Header
- **Stack View**: Alle Stacks expandiert zeigen (Taste `s`)
  - Header zeigt "BOARD (STACK VIEW)" in Cyan
  - Beide Stack-Typen (Group + Sequential) werden aufgeklappt
  - Type-Icons: + für Group, → für Sequential
  - Zurück zu Normal: erneut `s` drücken

#### Keyboard Shortcuts (Global)
- **/** (Slash): Filter Command Palette öffnen
- **n**: Input Modal öffnen (neue Note erstellen)
- **s**: Stack View toggle (nur in Board View)
- **Cmd+Z** (Ctrl+Z): Undo (letzte Aktion rückgängig machen)
- **ESC**: Modals schließen (Input, Filter, Stack Modal)

### 2. Plan View
- Typewriter-Editor mit Live Markdown
- Auto-Task: `(Task 30m --k !!)` → Karte + grünes `[...] ✓`
- **Stack-Blöcke**: Mehrere Tasks als Stack erstellen
- **Parsing-Order**: Kategorie → Priorität → Zeit
- Storage: `planText` als innerHTML (nicht plain text!)

#### Keyboard Shortcuts (Plan View)
- **Cmd+B** (Ctrl+B): Bold
- **Cmd+I** (Ctrl+I): Italic
- **Cmd+Shift+8** (Ctrl+Shift+8): Bullet List
- **Cmd+Shift+C** (Ctrl+Shift+C): Checkbox
- **Cmd+Enter** (Ctrl+Enter): Stack erstellen (Alternative zu `/` Trigger)
- **Cmd+Z** (Ctrl+Z): Undo (letzte Aktion rückgängig machen)

#### Stack-Block-Syntax
```
seq: Stack Titel
- Task 1 30m --k
- Task 2 45m --h !!
- Task 3 20m --p
/  (oder Cmd+Enter)
```
- **Trigger**: `/` auf neuer Zeile ODER **Cmd+Enter** (fügt `/` automatisch ein)
- **Typen**: `seq:` = Sequential (→), `group:` = Group (+)
- **Parsing**: Jeder Bullet wie normaler Task (Zeit, Kategorie, Prio)
- **Reihenfolge**: Erste Task = Oberste Karte im Stack
- **Bestätigung**: `seq: Stack Titel [→ 3 Tasks] ✓` (grün, fade-in)
- **Check**: Stack mit gleichem Titel wird nicht doppelt erstellt
- **Debouncing**: Parsing läuft erst 300ms nach letzter Eingabe (Performance)
- **Cmd+Enter**: Bypassed Debouncing, triggert sofort

### 3. Kategorien
- `--k` (türkis), `--h` (gelb), `--p` (rot), `--u` (lila)
- Unterricht: `--u2a`, `--u2b`, etc. → Badge + Filter
- **Wichtig**: `--u` Parsing VOR anderen!

### 4. Zeit & Sessions
- Format: `30m`, `125m`
- **Work Timer im Header**: Start/Pause/Stop mit "bis HH:MM" Anzeige
- **Session Summary Modal**: Zeigt Stats nach Timer-Ende oder letztem Task completed
  - Geplante vs. tatsächliche Zeit
  - "Gespart: +15m" (grün) oder "Mehr: -10m" (rot)
  - Erscheint automatisch bei zwei Szenarien:
    1. Timer läuft ab
    2. Letzter offener Task wird erledigt (○)
- **Background Timer**: Läuft mit `Date.now()`, funktioniert auch wenn Tab inaktiv
- localStorage: `lastSessionData` (24h Ablauf)

### 5. Prioritäten
- Syntax: `!`, `!!`, `!!!`
- **Wichtig**: Als String speichern, nicht Number!

### 6. Stacking
- Drag auf Karte → Stack
- Typen: Group (+) = alle aktiv, Sequential (→) = nur Top aktiv
- Stack Modal: Klick → ↑↓ Reorder, ⇢ Unstack
- **Group Stack Unstacking (Board View)**: Wenn Filter aktiv, zeigt Group-Stacks Karten in dedizierten Zeilen
  - Jede Gruppe bekommt eigene Zeilen (Row-basierte Gruppierung)
  - Weißer gestrichelter Balken links (60px breit) mit vertikalem Gruppennamen
  - Karten können auf mehrere Zeilen umbrechen, Balken erstreckt sich über gesamte Höhe
  - Keine anderen Karten zwischen Gruppen-Zeilen
  - CSS: `.group-row-wrapper` (full-width), `.group-row-sidebar` (dashed border), `.group-row-label` (vertical text)
  - Sequential-Stacks bleiben gestackt auch bei Filtern
  - **Nur Board View**: In Kanban bleiben Gruppen normal (farbige Borders)

### 7. Kanban
- 8 Spalten: Unassigned + Mo-So
- Drag zwischen Tagen
- Filter: Zeit/Kategorie, keine Tag-Filter

### 8. Completed Counter
- Zählt erledigte Tasks heute
- Auto-Reset bei Mitternacht
- **Nur** bei Complete (○), nicht bei Delete!
- Angezeigt in Input Modal Header

### 9. Undo System
- **Cmd+Z** (Ctrl+Z) macht letzte Aktion rückgängig
- **Unterstützt**: Note/Stack Creation, Note Deletion, Note Completion
- **History**: Bis zu 10 Aktionen im `undoStack`
- **Stack Undo**: Entfernt Stack UND alle dazugehörigen Notes
- **Scope**: Funktioniert global, außer in Input/Textarea (außer Plan Editor)
- **Wichtig**: Undo entfernt Notes permanent (nicht nur complete)

### 10. Visuelle Animationen
- **Stack/Task Creation**: Fade-in Animation (0.5s) für grüne Bestätigung in Plan View
- **Neue Karten**: Opacity-basierter Pulse-Effekt (2 Pulses, 1.4s) für neu erstellte Notes
- **Tracking**: `newlyCreatedNoteIds` Set speichert IDs bis View-Switch
- **Trigger**: Animation startet automatisch beim Switch zu Board/Kanban View
- **Cleanup**: Nach 1s werden IDs aus Set entfernt, Animation endet automatisch

## Kritische Implementierungsdetails

### Parsing-Reihenfolge (addNote)
```javascript
// 1. Kategorie (--u2a, --k, --h, --p)
// 2. Priorität (!!)
// 3. Zeit (30m)
// 4. Content = Rest
// WICHTIG: Kategorie ZUERST!
```

### Edit-Modus
- Original-Werte: `note._originalContent`, `_originalCategory`, `_originalTime`
- Enter speichert, ESC restored

### Stack Cleanup
```javascript
// Beim Delete/Complete:
stacks.forEach(s => s.noteIds = s.noteIds.filter(id => id !== noteId));
stacks = stacks.filter(s => s.noteIds.length > 0);
```

### Filter-Logik
- **Command Palette Integration**: Filter via Keyboard (`/`) oder Button-Click
- **Filter-ID Format**: `type-value` (z.B. `time-0-15`, `category-k`)
  - **Wichtig**: Nur ersten Dash splitten (preserve `0-15` in `time-0-15`)
- **Mapping zu alten Buttons**: Palette aktiviert Legacy-Filter-Buttons im Hintergrund
- Kategorie: OR
- Zeit: OR
- Tags: OR
- Zwischen Typen: AND
- Sequential Stacks: Nur Top-Karte filtern

## Design-Entscheidungen

- **Keine Frameworks**: Minimale Größe, volle Kontrolle
- **LocalStorage**: Keine Backend-Infrastruktur
- **ContentEditable**: Native Rich Text besser als Markdown-Parsing
- **HTML Storage**: innerHTML statt textContent (bewahrt Formatierung)
- **Command Palette statt Button-Grid**: Keyboard-first UX, weniger visueller Clutter
- **Modal-basierter Input**: Fokussiertes Erstellen ohne permanentes UI-Element
- **Backward Compatibility**: Neue Filter-Palette nutzt alte Filter-Button-Logik (click events)
- **Header-Timer**: Wichtigste Info immer sichtbar, kein Sidebar-Scrolling nötig

## Wichtige Bugs/Fixes

1. **Priorität als String**: `'!!'` nicht als Number speichern
2. **updateWorkSidebar**: Timer nicht auto-stoppen → race condition
3. **Cursor-Management**: Nach Task-Creation aus grünem Span bewegen
4. **--u Parsing**: Vor anderen Kategorien parsen
5. **Session Stats**: localStorage persistent, nicht nur in Sidebar
6. **Stack-Block Parsing**: Trigger (`/`) nötig, sonst wird bei jedem Input neu erstellt
7. **Stack Zeit-Addition**: Summe aller Tasks (auch bei Sequential), nicht nur Top-Card
8. **getPlainText()**: `<br>` und `<div>` zu `\n` konvertieren für Regex-Matching
9. **Zeit-Filter Split Bug**: `split('-')` auf `time-0-15` zerbrach Value → nur ersten Dash splitten
10. **Timer Display**: `display: 'block'` verhinderte Flex-Layout → `display: 'flex'` nötig
11. **Session Summary Modal**: `display: 'block'` statt `'flex'` → Modal nicht korrekt zentriert
12. **startTime TypeError**: `startTime.getTime()` failed → startTime ist bereits Number, nicht Date

## LocalStorage Keys

- `simpleNotes`: Note-Array
- `simpleStacks`: Stack-Array
- `planText`: Plan View HTML
- `lastSessionData`: Session-Statistik
- `completedCounter`: { count, date }
- `backupSettings`: IndexedDB für Auto-Backup

## Button-Layout

**Normal**: × | Zeit | ... | ○ | ⋮
**Modal**: × | Zeit | ↑ | ↓ | ... | ⇢ | ○ | ⋮

## Datei-Struktur

- **index.html**: Main HTML mit Header, Modals, Views
- **app.js**: Core App-Logik (Notes, Stacks, Timer, Filters)
- **ui-redesign.js**: UI-Layer (Filter Palette, Input Modal, Header Updates)
- **style.css**: Alle Styles (Header, Modals, Cards, Animations)
- **sw.js**: Service Worker für PWA (Cache-Versioning)
- **manifest.json**: PWA Manifest
- **CLAUDE.md**: Dev Docs (dieses File)

## Entwickelt mit Claude Code

**Lessons Learned**:
- Parsing-Reihenfolge kritisch
- CSS Variables für dynamische Farben
- LocalStorage braucht Cleanup
- Animations-Timing wichtig (300ms debounce, 1s animation)
- Modal besser als Inline für komplexe Interaktionen
- Buttons besser als Drag & Drop für Reordering
- Event-Listener Duplikation vermeiden
- ContentEditable + `execCommand()` für Rich Text
- **Explizite Trigger** (wie `/`) besser als implizite (Leerzeile, EOF) für User-Actions
- **Keyboard Shortcuts** als Alternative zu visuellen Triggern (Cmd+Enter statt `/`)
- **HTML-zu-Text-Konvertierung** muss Newlines preservieren (`<br>`/`<div>` → `\n`)
- **Stack-Block-Parsing**: Bei `input` Event läuft Code oft (Performance beachten!)
- **Debouncing**: 300ms Delay = bessere Performance ohne spürbare Latenz
- **Animation-Timing**: Trigger bei View-Switch, nicht bei Creation (besseres UX)
- **Visuelles Feedback**: CSS-Animationen mit `setTimeout` cleanup nach Animation-Ende
- **Undo-System**: Simple Stack-basierte History reicht für 90% Use Cases
- **newlyCreatedNoteIds Set**: Temporäres Tracking für Animations-State zwischen Views
- **Opacity-Animationen** besser als Transform für subtile Effekte (weniger aufdringlich)
- **Visuelle Gruppierungs-Indikatoren**: Row-basierte Gruppierung besser als einzelne Borders oder SVG-Linien
- **Grid-Layout Flexibilität**: Full-width Wrapper (`grid-column: 1 / -1`) + inneres Grid = flexible Zeilen-Gruppierung
- **Vertikaler Text**: `writing-mode: vertical-rl` + `transform: rotate(180deg)` für lesbare vertikale Labels
- **Dashed Borders**: Besser als solid/colored für subtile visuelle Trennung
- **Dedicated Rows**: Keine gemischten Karten = klare Gruppierung, einfacher zu scannen
- **UI Redesign (v12-v37)**:
  - Command Palette >> Button Grid (weniger visueller Clutter)
  - Modal Input >> Always-visible (Fokus + cleaner UI)
  - Header Timer >> Sidebar (wichtigste Info immer sichtbar)
  - Single-Line Header >> 3-Row Header (kompakter, professioneller)
  - Keyboard-first Design (`/`, `n`, `s`) = schnellere Workflows
  - Filter-ID String-Splitting: Nur ersten Dash beachten (preserve komplexe Values)
  - Display-Properties beachten: `flex` vs `block` für Layout-Struktur
  - startTime als Number (timestamp), nicht Date-Object speichern
  - Session Summary Modal: 2 Trigger-Szenarien (Timer + Last Task)
