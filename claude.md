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

### 1. Plan View
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

### 2. Kategorien
- `--k` (türkis), `--h` (gelb), `--p` (rot), `--u` (lila)
- Unterricht: `--u2a`, `--u2b`, etc. → Badge + Filter
- **Wichtig**: `--u` Parsing VOR anderen!

### 3. Zeit & Sessions
- Format: `30m`, `125m`
- Session Stats: Nach Work-Timer → "Gespart: +15m" (grün) oder "Mehr: -10m" (rot)
- localStorage: `lastSessionData`

### 4. Prioritäten
- Syntax: `!`, `!!`, `!!!`
- **Wichtig**: Als String speichern, nicht Number!

### 5. Stacking
- Drag auf Karte → Stack
- Typen: Group (+) = alle aktiv, Sequential (→) = nur Top aktiv
- Stack Modal: Klick → ↑↓ Reorder, ⇢ Unstack
- **Group Stack Unstacking**: Wenn Filter aktiv, zeigt Group-Stacks Karten individuell
  - Jede Gruppe bekommt einzigartige Farbe als 12px linke Border
  - 8 Farben-Palette (Light Blue, Green, Orange, Purple, Gold, Teal, Rose, Sky Blue)
  - Farben werden automatisch zugewiesen, cycling bei >8 Gruppen
  - Funktion: `assignGroupColors()` mapped Stack-IDs zu Farben
  - Sequential-Stacks bleiben gestackt auch bei Filtern

### 6. Kanban
- 8 Spalten: Unassigned + Mo-So
- Drag zwischen Tagen
- Filter: Zeit/Kategorie, keine Tag-Filter

### 7. Completed Counter
- Zählt erledigte Tasks heute
- Auto-Reset bei Mitternacht
- **Nur** bei Complete (○), nicht bei Delete!

### 8. Undo System
- **Cmd+Z** (Ctrl+Z) macht letzte Aktion rückgängig
- **Unterstützt**: Note/Stack Creation, Note Deletion, Note Completion
- **History**: Bis zu 10 Aktionen im `undoStack`
- **Stack Undo**: Entfernt Stack UND alle dazugehörigen Notes
- **Scope**: Funktioniert global, außer in Input/Textarea (außer Plan Editor)
- **Wichtig**: Undo entfernt Notes permanent (nicht nur complete)

### 9. Visuelle Animationen
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

## Wichtige Bugs/Fixes

1. **Priorität als String**: `'!!'` nicht als Number speichern
2. **updateWorkSidebar**: Timer nicht auto-stoppen → race condition
3. **Cursor-Management**: Nach Task-Creation aus grünem Span bewegen
4. **--u Parsing**: Vor anderen Kategorien parsen
5. **Session Stats**: localStorage persistent, nicht nur in Sidebar
6. **Stack-Block Parsing**: Trigger (`/`) nötig, sonst wird bei jedem Input neu erstellt
7. **Stack Zeit-Addition**: Summe aller Tasks (auch bei Sequential), nicht nur Top-Card
8. **getPlainText()**: `<br>` und `<div>` zu `\n` konvertieren für Regex-Matching

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
- **Visuelle Gruppierungs-Indikatoren**: Border-basiert besser als SVG-Linien (clearer, einfacher)
- **Dynamische Farb-Zuweisung**: JS-basiert statt CSS ermöglicht intelligente Color-Cycling
- **Color Palette Design**: Farben müssen von Kategorie-Farben unterscheidbar sein
