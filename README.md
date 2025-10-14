# Simple Notes App

Minimalist terminal-inspired todo manager with card stacking, time tracking, and smart categorization.

**Pure Vanilla JavaScript** - No dependencies, runs directly in browser.

## Quick Start

Open `index.html` in your browser. No installation needed.

## Core Features

### 📝 Three Views

1. **Board View** (⊟): Grid layout for daily work
2. **Kanban View** (✎): Week planning with 8 columns (Unassigned + Mon-Sun)
3. **Plan View** (⊞): Typewriter-style notepad with auto-task creation

Switch views with button in header.

### ✍️ Plan View

Minimalist writing space for planning:

- **Live Markdown**: Cmd+B (bold), Cmd+I (italic), Cmd+Shift+8 (list), Cmd+Shift+C (checkbox)
- **Auto Tasks**: `(Meeting 30m --k)` → creates card, becomes green `[...] ✓`
- **Persistent**: Auto-saves to localStorage

**Example:**
```
**Today's Goals**
- (Team meeting 30m --k)
- (Code review 45m --k !!)
- [ ] Email responses
```

### 🎨 Categories

- `--k` → Turquoise (KSWIL)
- `--h` → Yellow (HSLU)
- `--p` → Pink (Privat)
- `--u2a`, `--u2b`, etc. → Purple + class badge (Teaching)

### ⏱️ Time Tracking

- Add time: `Task 30m`
- Session Stats: After work timer shows "Gespart: +15m" (green) or "Mehr: -10m" (red)
- Header displays time totals per category

### ⭐ Priorities

Add `!`, `!!`, or `!!!` to tasks → red indicator on card

### 📚 Card Stacking

- **Create**: Drag one card onto another
- **Stack Types**:
  - Group (+): All cards active
  - Sequential (→): Only top card active, rest blocked
- **Manage**: Click stack → Modal opens with:
  - ↑↓ buttons to reorder
  - ⇢ button to unstack
  - Edit, delete, complete

### 🔍 Filtering

- **Category**: KSWIL, HSLU, Privat, Class filters
- **Time**: ≤15m, 16-30m, 31-60m, 60m+
- **Days**: Filter by assigned day (Board view only)

### 🎯 Focus Mode

- Mark cards as focused (• button)
- Sidebar shows total time
- Start work timer for time-boxed sessions

### ✅ Daily Counter

Bottom right shows tasks completed today. Resets at midnight.

## Usage

### Creating Notes

```
Basic: Write documentation
With time: Team meeting 45m
With category: Deploy 120m --k
With priority: Fix bug 30m --k !!!
Teaching: Mathe korrigieren 45m --u3a !!
```

### Editing Cards

1. Click **⋮** (three-dot menu)
2. Edit content, time, category
3. **Enter** to save, **ESC** to cancel

### Keyboard Shortcuts

**Global**:
- `Cmd/Ctrl + ↑/↓` → Command Palette
- `ESC` → Close modals / Clear filters

**Plan View**:
- `Cmd+B/I` → Bold/Italic
- `Cmd+Shift+8` → Bullet list
- `Cmd+Shift+C` → Checkbox
- `Alt+X` → Toggle checkbox

## Technical

- **Storage**: LocalStorage (`simpleNotes`, `simpleStacks`, `planText`)
- **Backup**: Auto-backup every 5 min (Chrome only, File System Access API)
- **Browser**: Chrome, Firefox, Safari, Edge (latest)

## Design

Terminal-inspired: Dark background (#0f0f0f), monospace font, dashed borders, smooth animations.

## License

MIT - Use and modify freely.

---

**Developed with Claude Code** - AI-powered development assistant.
