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
- Typewriter-Editor mit Live Markdown (Cmd+B, Cmd+I, Cmd+Shift+8, Cmd+Shift+C)
- Auto-Task: `(Task 30m --k !!)` → Karte + grünes `[...] ✓`
- **Parsing-Order**: Kategorie → Priorität → Zeit
- Storage: `planText` als innerHTML (nicht plain text!)

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

### 6. Kanban
- 8 Spalten: Unassigned + Mo-So
- Drag zwischen Tagen
- Filter: Zeit/Kategorie, keine Tag-Filter

### 7. Completed Counter
- Zählt erledigte Tasks heute
- Auto-Reset bei Mitternacht
- **Nur** bei Complete (○), nicht bei Delete!

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
- Animations-Timing wichtig (300ms)
- Modal besser als Inline für komplexe Interaktionen
- Buttons besser als Drag & Drop für Reordering
- Event-Listener Duplikation vermeiden
- ContentEditable + `execCommand()` für Rich Text
