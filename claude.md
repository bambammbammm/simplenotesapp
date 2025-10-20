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
- **Cmd+K** (Ctrl+K): Universal Task/Stack Creator Modal öffnen
- **Cmd+Z** (Ctrl+Z): Undo (letzte Aktion rückgängig machen)
- **ESC**: Modals schließen (Input, Filter, Stack Modal, Creator Modal)

### 2. Plan View
- **Zen Mode**: Header und Sidebar versteckt, nur Editor + Action-Buttons
- **Typewriter Scrolling**: Aktuelle Zeile bleibt immer vertikal zentriert
- **Editor**: 50vh Padding oben/unten, wächst mit Content
- Auto-Task: `(Task 30m --k !!)` → Karte + grünes `[...] ✓`
- **Stack-Blöcke**: Mehrere Tasks als Stack erstellen
- **Universal Creator Icons**: Weiße Task-Icons, lila Stack-Icons (klickbar zum Bearbeiten)
- **Icon Insertion**: Inline im Text, Cursor automatisch nach Icon + Space
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

### 11. Universal Task/Stack Creator Modal (Cmd+K)
- **Zugriff**: Cmd+K (Ctrl+K) in Board oder Plan View
- **Features**:
  - Erstelle Tasks oder Stacks mit vollständigem GUI
  - Alle Felder: Content, Zeit, Kategorie, Priorität, Tag
  - Multiple Tasks hinzufügen → Stack-Optionen erscheinen
  - Stack-Typen: None, Group (+), Sequential (→)
  - Reorder Tasks mit ↑↓ Buttons
  - Einzelne Tasks entfernen mit × Button
- **Edit Mode**: Klick auf Icon öffnet Modal zum Bearbeiten
  - Tasks: Alle Felder editierbar
  - Stacks: Tasks doppelklicken zum Bearbeiten, Enter zum nächsten
  - Sequential Editing: Mehrere Tasks nacheinander bearbeiten
  - Visuelles Feedback: Grüner Button, blaue Border bei aktiver Task
- **Plan View Integration**:
  - Icons werden inline im Text eingefügt
  - Weiße Icons für Tasks, lila Icons für Stacks
  - Zeigen Namen/Titel (nicht nur Symbole)
  - Cursor automatisch nach Icon + Leerzeichen
  - Empty DIV Detection: Icons vor leeren `<div>` einfügen (bleibt inline)
  - setTimeout(10ms) für Cursor-Fokus nach Modal-Close
  - **Tabellen-Integration**: Tasks/Stacks können in Tabellenzellen erstellt werden
    - Saved Range: Cursor-Position wird vor Modal-Open gespeichert
    - Icons werden korrekt in fokussierter Zelle eingefügt

### 12. Plan View Tabellen
- **Markdown-Style Syntax**: `| Header1 | Header2 |` erstellt Tabelle bei Enter
  - Auto-Separator: Nutzer muss keine `| ---- |` Zeile eingeben
  - Auto-Empty Row: Nur Header nötig, erste Zeile wird automatisch erstellt
- **Full-Width Layout**: Tabellen nutzen volle Breite, Spalten verteilen sich automatisch
- **Editable Cells**: Alle Zellen (th/td) sind contentEditable
- **Tab Navigation**: Tab/Shift+Tab zum Navigieren zwischen Zellen
- **Action Buttons**:
  - **+ Row** / **+ Column**: Zeilen/Spalten hinzufügen
  - **↑ Zeile** / **Zeile ↓**: Zeile nach oben/unten verschieben
  - **← Spalte** / **Spalte →**: Spalte nach links/rechts verschieben
  - **× Delete Table**: Tabelle mit Bestätigung löschen
- **Focus Tracking**: Tabelle speichert zuletzt fokussierte Zelle in `table._lastFocusedCell`
  - Nötig weil Button-Click den Fokus von Zelle zu Button verschiebt
  - Alle Zellen haben `focus` Event Listener
- **Styling**:
  - Header: Weißer Hintergrund, schwarzer fetter Text
  - Buttons: Weißer Text, weißer Hover-Rand (Delete-Button: rot beim Hover)
  - Focus: Türkiser Outline für aktive Zelle
- **Backwards Compatibility**: `updateExistingTables()` fügt neue Buttons zu alten Tabellen hinzu

### 13. Google Calendar Integration (v112)
- **OAuth 2.0 mit Google Identity Services (GIS)**
  - Read-only Zugriff auf alle Google Kalender
  - Neue GIS API (migriert von deprecated `gapi.auth2`)
  - OAuth Flow: `google.accounts.oauth2.initTokenClient()`
  - Access Token Management: `gapi.client.setToken()`
  - Credentials in localStorage gespeichert
- **Multi-Calendar Support**:
  - Fetcht Events von **allen** Kalendern (nicht nur primary)
  - Unterstützt: KSWIL, Familie, Privat, Holidays, etc.
  - Excludiert automatisch: "Week Numbers" Kalender
  - Parallel API Calls für bessere Performance
- **Button in Time Availability Section**:
  - "📅 Google Calendar verbinden" (blau)
  - Wird grün: "✓ Google Calendar verbunden"
  - Click zum Sign-in/Sign-out Toggle
- **Event Fetching**:
  - `fetchTodaysEvents()`: Heutige Events für AI Briefing
  - `fetchWeekEvents()`: Nächste 7 Tage für Wochenüberblick
  - Events enthalten: summary, time, location, calendarName
  - Sortiert nach Startzeit

### 14. AI Briefing mit Calendar Events (v112)
- **Keyboard Shortcut**: Cmd+Shift+B (Ctrl+Shift+B)
- **Drei Hauptsektionen**:
  1. **Kalender Events (heute)**: Nur Google Calendar Events
     - Format: `📅 HH:MM-HH:MM: Event Name [Kalender]`
     - Excludiert "Week Numbers" Kalender
     - Mit Location falls vorhanden
  2. **Zeitplan (Tasks)**: Berechneter Zeitplan aus Time Availability
     - Emoji-basiert (🔥⚡📚💼🎓🏠)
     - Mit Kategorie, Priorität, Dauer
     - Task-Splitting falls nötig
  3. **Wochenausblick**: Nächste 7 Tage (ab morgen)
     - Alle Calendar Events mit Tag, Uhrzeit, Kalender
     - Wichtige Tasks (!! oder !!!)
     - Als Fließtext formatiert (nicht als Liste)
- **Prompt Engineering**:
  - KI bekommt strukturierte Daten (JavaScript macht Berechnungen)
  - Anweisung: "Kopiere 1:1" für exakte Zeitangaben
  - Fließtext für Wochenausblick (nicht technisch)
  - Markdown-to-HTML Konvertierung für schöne Darstellung
- **Ollama Integration**:
  - Lokales Model: `gemma3:4b`
  - Endpoint: `http://127.0.0.1:11434/api/generate`
  - Fallback mit hilfreichen Fehler-Messages

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
- `googleClientId`: Google OAuth Client ID (v112)
- `googleApiKey`: Google API Key (v112)

## Button-Layout

**Normal**: × | Zeit | ... | ○ | ⋮
**Modal**: × | Zeit | ↑ | ↓ | ... | ⇢ | ○ | ⋮

## Datei-Struktur

- **index.html**: Main HTML mit Header, Modals, Views
- **app.js**: Core App-Logik (Notes, Stacks, Timer, Filters, Typewriter Scrolling)
- **ui-redesign.js**: UI-Layer (Filter Palette, Input Modal, Header Updates)
- **task-creator.js**: Universal Task/Stack Creator Modal (Cmd+K)
- **style.css**: Alle Styles (Header, Modals, Cards, Animations, Zen Mode)
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
- **Plan Mode Zen & Creator (v54-v59)**:
  - Zen Mode: body.zen-mode class für beide switchView Funktionen
  - Typewriter Scrolling: Container scrollbar, Editor mit 50vh Padding
  - Universal Creator: Separates Modul (task-creator.js) für saubere Trennung
  - Icon Insertion: Empty DIV Detection + setTimeout für Cursor-Fokus
  - Inline Icons: insertBefore() statt appendChild() bei leeren Divs
  - Sequential Editing: State Management mit editingTaskId variable
  - Visual Feedback: Button colors + border für aktive Edit-States
  - Plan-Actions Visibility: display:none default, nur bei zen-mode flex
- **Plan View Tabellen (v85-v98)**:
  - Markdown-Parsing: Nur Header + Enter = vollständige Tabelle (Auto-Separator + Auto-Row)
  - Focus Tracking: Element-Property (`table._lastFocusedCell`) statt `document.activeElement`
    - Button-Clicks verschieben Fokus → gespeicherte Referenz nötig
  - Saved Range für Modal: `range.cloneRange()` vor Modal-Open speichern
    - Modals löschen Selection → Range muss in Context gespeichert werden
  - DOM Tree Walking: `while` Loop nach oben bis TD/TH gefunden (table cell detection)
  - Event Listener auf Cells: Jede neue Zelle braucht Focus-Listener (addRow/addColumn)
  - updateExistingTables(): Backwards compatibility beim Load für alte Tabellen
  - Separate Hover-States: Header (`#f0f0f0`) vs Body (`rgba(...)`) für bessere UX
- **Completed State Visualization (v99-v100)**:
  - Task/Stack Icons im Plan Mode zeigen completion status
  - `data-note-id` und `data-stack-id` Attribute für Icon-Note-Verknüpfung
  - `.task-icon.completed` CSS-Klasse für durchgestrichenen, grauen Look
  - `updatePlanTaskIcons()` Funktion checkt alle Icons gegen notes/stacks Array
  - Stack completed wenn alle Notes gelöscht/completed sind
  - Updates bei: toggleComplete(), loadPlanText(), undo()
  - Icon-Tracking funktioniert für beide Erstellungsmethoden (inline syntax + Cmd+K)
- **Global Table Action Buttons (v101)**:
  - Alle Tabellen-Buttons jetzt global in Plan Actions (statt per-table)
  - 7 Buttons: + Row, + Column, ↑ Zeile, Zeile ↓, ← Spalte, Spalte →, × Delete
  - `currentFocusedTable` Variable trackt fokussierte Tabelle
  - `setCurrentFocusedTable()` wird bei Cell-Focus aufgerufen
  - `updateTableButtonsState()` enabled/disabled Buttons basierend auf Fokus
  - Buttons disabled bis Tabellenzelle fokussiert ist
  - updateExistingTables() entfernt alte per-table Button-Divs
  - Konsistentes Styling mit Speichern/Neue Notiz Buttons
  - Visual Divider trennt normale von Tabellen-Buttons
- **Google Calendar Integration (v111-v112)**:
  - **Migration von gapi.auth2 zu GIS**: Deprecated API → Google Identity Services
    - Problem: `idpiframe_initialization_failed` bei neuen Clients
    - Lösung: `google.accounts.oauth2.initTokenClient()` statt `gapi.auth2.getAuthInstance()`
    - Token Management: `gapi.client.setToken({ access_token })` manuell setzen
  - **Multi-Calendar Fetching**: Promise.all() für parallele API Calls
    - Alle Kalender fetchen, nicht nur "primary"
    - Events mit `_calendarName` Property markieren
  - **Week Numbers Kalender**: Automatisch excludieren (kein User-Content)
  - **Popup Blocking**: OAuth muss direkt aus User-Click kommen, nicht setTimeout
    - Erst Init → User klickt nochmal → dann OAuth Popup
  - **Wochenüberblick Formatting**:
    - Problem: KI fasst zu kurz zusammen oder kopiert Tasks als Events
    - Lösung: Explizite Anweisungen "Kopiere NUR Kalender Events", "NICHT die Tasks"
    - Fließtext statt technische Liste für bessere Lesbarkeit
  - **Credentials Storage**: localStorage für Client ID und API Key
    - Prompt beim ersten Mal, dann persistent
    - Keine Secrets im Code (user provides own)

## Phase 3: Kanban → Kalender Transformation (WIP - v102+)

### Konzept

**Problem mit altem Kanban:**
- Statische Wochentage (Mo-So) ohne konkrete Daten
- Keine echten Deadlines/Termine
- Umständliches Handling

**Neue Lösung: Monatskalender-Ansicht**
- Zeigt ganzen Monat als Grid
- Backlog-Spalte links für unzugewiesene Tasks
- Drag & Drop von Backlog zu Kalendertag weist echtes Datum zu
- Echte Termine statt abstrakte Wochentage

### Datenmodell-Änderung

**ALT:**
```javascript
{
  assignedDay: 'monday'  // abstrakt, relativ
}
```

**NEU:**
```javascript
{
  dueDate: '2025-10-21'  // konkret, ISO-Format (YYYY-MM-DD)
}
```

**Warum ISO-Format (YYYY-MM-DD):**
- Menschenlesbar und debuggbar
- Standard in JavaScript: `new Date('2025-10-21')`
- Einfache String-Vergleiche und Sortierung
- Kein Timezone-Chaos

### Layout-Konzept

```
┌─────────────────┬──────────────────────────────────────────┐
│   BACKLOG       │  < Oktober 2025 >      [Heute]          │
│                 ├──────────────────────────────────────────┤
│  [Task 1]       │  Mo  Di  Mi  Do  Fr  Sa  So             │
│  [Task 2]       │ ┌──┬──┬──┬──┬──┬──┬──┐                 │
│  [Task 3]       │ │  │  │1 │2 │3 │4 │5 │                 │
│                 │ ├──┼──┼──┼──┼──┼──┼──┤                 │
│  Drag Tasks →   │ │6 │7 │8 │9 │10│11│12│                 │
│  zum Datum      │ ├──┼──┼──┼──┼──┼──┼──┤                 │
│                 │ │13│14│15│16│17│18│19│                 │
│                 │ ├──┼──┼──┼──┼──┼──┼──┤                 │
│                 │ │20│21│22│23│24│25│26│  ← Heute       │
│                 │ ├──┼──┼──┼──┼──┼──┼──┤                 │
│                 │ │27│28│29│30│31│  │  │                 │
│                 │ └──┴──┴──┴──┴──┴──┴──┘                 │
└─────────────────┴──────────────────────────────────────────┘
```

### Features

**1. Kalender-Grid**
- Zeigt aktuellen Monat (default: heute)
- 7 Spalten (Mo-So), ~5-6 Zeilen
- Jede Zelle = 1 Tag mit Tasks

**2. Backlog-Spalte**
- Alle Tasks ohne `dueDate`
- Fixed width links (ca. 300px)
- Scrollable bei vielen Tasks
- Gleiche Card-Darstellung wie Board View

**3. Monatsnavigation**
- `< Oktober 2025 >` Header mit Vor/Zurück-Buttons
- "Heute" Button springt zu aktuellem Monat
- Aktueller Monat wird in State gespeichert

**4. Visuelle States**
- **Heute**: Türkiser Border/Highlight
- **Vergangene Tage**: Leicht grau/ausgegraut (Tasks bleiben sichtbar)
- **Wochenende**: Optional andere Hintergrundfarbe
- **Mit Tasks**: Badge mit Count

**5. Tasks in Zellen**
- Kompakte Card (nur Titel + Zeit)
- Hover: Volle Info (Tooltip oder Expand)
- Click: Edit Modal
- Mehrere Tasks: Scrollbar oder Stacked View
- Drag & Drop Support

**6. Drag & Drop**
- Backlog → Kalendertag: Setzt `dueDate`
- Tag → Tag: Ändert `dueDate`
- Tag → Backlog: Entfernt `dueDate` (setzt auf `null`)
- Ganzer Stack wird zusammen verschoben

**7. Filter-Anpassung (Board View)**
- Tag-Filter (Mo-So) beziehen sich auf **aktuelle Woche**
- Montag-Filter = nur Montag dieser Woche
- Vergangene Tage vorerst nicht ausgeblendet
- Später: Warnung für überfällige Tasks

### Implementierungs-Plan

**Phase 1: Basis-Struktur (v102)**
- [ ] HTML: Backlog-Spalte + Kalender-Grid mit statischem Monat
- [ ] CSS: Grid-Layout (7 Spalten), Backlog-Spalte fixed width
- [ ] JavaScript: Monatsdaten generieren (Tage-Array)
- [ ] JavaScript: `renderCalendar()` Funktion
- [ ] Statischer Test-Monat (z.B. Oktober 2025)

**Phase 2: Navigation (v103)**
- [ ] State: `currentMonth` und `currentYear` Variablen
- [ ] Monatsnavigation: Vor/Zurück-Buttons
- [ ] "Heute" Button zum Zurückspringen
- [ ] Month/Year Display im Header
- [ ] Monat speichern in localStorage (optional)

**Phase 3: Drag & Drop (v104)**
- [ ] Drag-Handler für Cards (bereits vorhanden, anpassen)
- [ ] Drop-Zones für Kalenderzellen
- [ ] Drop-Handler: Setzt `dueDate` auf ISO-Datum
- [ ] Drag zurück zu Backlog: Entfernt `dueDate`
- [ ] Visual Feedback beim Drag (Highlight Drop-Zone)

**Phase 4: Migration & Polish (v105)**
- [ ] Migration: `assignedDay` → `dueDate` beim App-Start
- [ ] Converter-Funktion: `getNextDayOfWeek('monday')` → ISO
- [ ] Visuelle States: Heute-Highlight, Vergangene Tage
- [ ] Filter anpassen: Tag-Filter auf aktuelle Woche
- [ ] Empty States (leere Zellen, leerer Backlog)
- [ ] Performance: Nur sichtbare Zellen rendern (optional)

### Migration-Strategie

```javascript
// Beim App-Load: Migriere alte assignedDay zu dueDate
function migrateAssignedDayToDueDate() {
  let migrated = 0;

  this.notes.forEach(note => {
    if (note.assignedDay && !note.dueDate) {
      // Konvertiere 'monday' → nächsten Montag ab heute
      note.dueDate = getNextDayOfWeek(note.assignedDay);
      delete note.assignedDay;
      migrated++;
    }
  });

  if (migrated > 0) {
    console.log(`Migrated ${migrated} notes from assignedDay to dueDate`);
    this.saveNotes();
  }
}

function getNextDayOfWeek(dayName) {
  const days = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
    friday: 5, saturday: 6, sunday: 0
  };

  const today = new Date();
  const targetDay = days[dayName];
  const currentDay = today.getDay();

  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) daysUntilTarget += 7; // Nächste Woche

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);

  return targetDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}
```

### Technische Details

**Kalender-Generierung:**
```javascript
function generateCalendarMonth(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  // Offset für Montag-Start (Mo = 0)
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const weeks = [];
  let week = new Array(offset).fill(null); // Empty cells vor Monatsbeginn

  for (let day = 1; day <= daysInMonth; day++) {
    week.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day: day,
      isToday: isToday(year, month, day),
      isPast: isPast(year, month, day)
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Letzte Woche mit Empty Cells auffüllen
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}
```

**Filter für aktuelle Woche:**
```javascript
function getCurrentWeekDates() {
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);

  // Montag dieser Woche
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  monday.setDate(today.getDate() - daysFromMonday);

  const weekDates = {};
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    .forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      weekDates[day] = date.toISOString().split('T')[0];
    });

  return weekDates;
}
```

### Offene Fragen / Später

- [ ] Was passiert mit überfälligen Tasks? (Warnung, Auto-Move, nichts)
- [ ] Multi-Monat-View (Quartal, Jahr)?
- [ ] Wiederholende Tasks (Recurring)?
- [ ] Kalender-Export (iCal)?
- [ ] Sprint/Milestone-Marker im Kalender?
