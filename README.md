# Simple Notes App

A minimalist, terminal-inspired notes and todo management application with advanced features like card stacking, time tracking, and category-based organization.

## Features

### Core Functionality
- **Quick Note Entry**: Create notes instantly with a terminal-style input prompt
- **Card-Based Display**: Notes appear as draggable cards on a canvas
- **Persistent Storage**: All notes are automatically saved to browser localStorage
- **Fade Animations**: Smooth animations when creating or removing cards
- **Three Views**: Board, Kanban, and Plan view for different workflows

### Advanced Features

#### 📝 Plan View (New!)
Minimalist typewriter-style notepad for planning with automatic task creation:
- **Clean Writing Space**: Distraction-free, centered editor with Courier font
- **Live Markdown Rendering**: Bold, italic, bullet lists, and checkboxes render as you type
- **Keyboard Shortcuts**:
  - `Cmd+B` → **Bold text**
  - `Cmd+I` → *Italic text*
  - `Cmd+Shift+8` → Bullet list
  - `Cmd+Shift+C` → Checkbox
- **Auto Task Creation**: Write `(Task name 30m --k)` and it automatically creates a card
- **Visual Feedback**: Created tasks turn green with ✓ mark
- **Persistent**: Content saves automatically to localStorage

**Example Plan:**
```
**Today's Goals**

- [ ] Morning routine
- (Team meeting 30m --k)
- [x] Email responses
- (Code review 45m --k !!)

*Notes:* Focus on high-priority items
```

#### 🎨 Color-Coded Categories
Tag your notes with color categories:
- `--k` → Turquoise border (KSWIL)
- `--h` → Yellow border (HSLU)
- `--p` → Pink border (Privat)
- `--u` → Purple border (Unterricht/Teaching)

**Example:** `Meeting preparation --k`

#### ⏱️ Time Tracking & Session Stats
Add time estimates to your notes and track performance:
- Format: `15m`, `30m`, `125m` (minutes)
- Time displays in the card header
- Automatic time summation in stacks
- **Session Statistics**: After completing a work session, see time saved/used
  - Green "Gespart: +15m" if faster than planned
  - Red "Mehr: -10m" if slower than planned
  - Displayed persistently in header

**Example:** `Write documentation 60m --p`

#### ⭐ Priority System
Add priority levels to tasks:
- `!` → Priority 1 (displayed as red !)
- `!!` → Priority 2 (displayed as red !!)
- `!!!` → Priority 3 (displayed as red !!!)
- Filterable by priority level
- Visual indicator next to time display

**Example:** `Fix critical bug 30m --k !!!`

#### 👨‍🏫 Teaching Category with Class Tags
Special category for teaching tasks:
- `--u2a`, `--u2b`, `--u2c` → Class 2a, 2b, 2c
- `--u3a`, `--u3b` → Class 3a, 3b
- `--u5` → Class 5
- Purple card border
- Class badge displayed on card
- Filterable by class

**Example:** `Mathe korrigieren 45m --u3a !!`

#### ✅ Completed Counter
Track your daily productivity:
- Counter shows tasks completed today
- Automatically resets at midnight
- Displayed in bottom right
- Only counts tasks marked with ○ (complete button)

**Example:** "5 heute erledigt"

#### 📚 Card Stacking
- **Drag & Drop**: Drag one card onto another to create a stack
- **Visual Stacking**: Cards stack vertically with a clean offset
- **Smart Ordering**: Last card placed appears on top
- **Total Time**: Stack shows combined time of all cards
- **Auto-Update**: Removing cards automatically recalculates stack time

#### 📊 Time Statistics
Header displays real-time statistics:
- **KSWIL:** Total time for turquoise cards
- **HSLU:** Total time for yellow cards
- **Privat:** Total time for red cards
- **other:** Total time for untagged cards
- **total:** Sum of all times

### Card Actions
- **×** (left): Delete card with fade animation
- **⋮** (three-dot menu): Edit card content, time, and category
- **○** (circle): Mark as complete (removes card with fade animation)

### Editing Cards
1. Click the **⋮** (three-dot menu) button on any card
2. The card content becomes editable
3. Modify text, add/change time (e.g., `30m`), or add/change category (e.g., `--k`)
4. Press **Enter** to save changes
5. Press **ESC** to cancel and restore original content

## Usage

### Creating Notes
1. Type your note in the input field at the bottom
2. Optionally add time: `Task name 30m`
3. Optionally add category: `Task name 30m --k`
4. Press **Enter** to create
5. Press **ESC** to clear input

### Organizing with Stacks
1. Create multiple notes
2. Drag one card onto another to create a stack
3. The cards form a stack with a badge showing card count
4. Continue adding cards to the stack by dragging onto it
5. **Click on a stack** to open the Stack Modal

### Managing Stacks
When you click on a stack badge, a modal opens with powerful management features:

- **View All Cards**: See all cards in the stack laid out vertically
- **Set Stack Title**: Give your stack a descriptive name
- **Toggle Stack Type**: Switch between Group (+) and Sequential (→) types
- **Edit Cards**: Click ⋮ on any card to edit it
- **Reorder Cards**: Use ↑ and ↓ buttons to move cards up or down
- **Unstack Cards**: Click ⇢ to remove a card from the stack
- **Delete/Complete**: Regular × and ○ buttons work in the modal
- **Close Modal**: Click X button, press ESC, or click outside the modal

The modal makes it easy to work with multiple related tasks grouped in a stack.

### Three-View System
Switch between three different views:

1. **Board View** (⊟): Default grid view for daily work
   - Cards displayed in grid layout
   - Drag & drop to create stacks
   - All filters available

2. **Kanban View** (✎): Week planning with columns
   - 8 columns: Unassigned + Monday-Sunday
   - Drag cards between days
   - Time totals per column
   - Time/category filters (day filters hidden)

3. **Plan View** (⊞): Minimalist writing space
   - Typewriter-style editor
   - Live Markdown rendering
   - Auto task creation with `(task name 30m --k)`
   - Perfect for planning and note-taking

**Switching:** Click the view button in header (cycles through all three views)

### Time Management
- Individual cards show their own time estimate
- Stacked cards show total time in white
- Header shows breakdown by category
- Complete or delete cards to update totals

## Technical Details

### Technologies
- Pure HTML5, CSS3, and Vanilla JavaScript
- No dependencies or frameworks
- LocalStorage for persistence
- CSS Grid for responsive layout

### Browser Support
- Modern browsers with localStorage support
- Chrome, Firefox, Safari, Edge (latest versions)

### Storage
All data is stored locally in your browser:
- `simpleNotes`: Individual note data
- `simpleStacks`: Stack relationships

## Design Philosophy

Inspired by terminal interfaces like Claude Code, the app features:
- Dark background (#0f0f0f)
- Monospace font
- Dashed borders for visual clarity
- Minimalist, distraction-free interface
- Smooth animations and transitions

## Keyboard Shortcuts

### Global
- `Enter` - Save note (or save edit when editing)
- `ESC` - Clear input field (or cancel edit when editing)
- `Cmd/Ctrl+Z` - Undo last action

### Plan View Only
- `Cmd/Ctrl+B` - Make text **bold**
- `Cmd/Ctrl+I` - Make text *italic*
- `Cmd/Ctrl+Shift+8` - Insert bullet list
- `Cmd/Ctrl+Shift+C` - Insert checkbox

## Installation

Simply open `index.html` in your browser. No build process or installation required.

For development:
```bash
# Open with a local server (recommended)
python -m http.server 8000
# or
npx serve
```

Then navigate to `http://localhost:8000`

## Examples

### Basic Note
```
Write email
```

### Note with Time
```
Team meeting 45m
```

### Categorized Note with Time
```
Deploy to production 120m --k
Review pull requests 30m --h
Read documentation 60m --p
```

### Creating and Managing a Stack
1. Create: `Backend API 60m --k`
2. Create: `Frontend integration 45m --k`
3. Create: `Testing 30m --k`
4. Drag all three onto each other → Stack shows badge "3 cards"
5. Top card shows total time: `135m` in white
6. Click on stack → Modal opens with all three cards
7. Use ↑↓ buttons to reorder, ⇢ to unstack, ⋮ to edit

## Recent Updates

### 📝 Plan View with Live Markdown (Latest!)
New minimalist writing mode for planning:
- **Typewriter Interface**: Clean, centered editor with Courier font
- **Live Markdown Rendering**: See bold, italic, lists as you type
- **Keyboard Shortcuts**: Cmd+B for bold, Cmd+I for italic, etc.
- **Auto Task Creation**: Write `(Task 30m --k)` to create cards instantly
- **Persistent Storage**: Content auto-saves to localStorage
- **Three-View Cycle**: Board → Kanban → Plan → Board

### ⭐ Priority System & Session Stats (Latest!)
Enhanced productivity tracking:
- **Priority Levels**: Add !, !!, or !!! to tasks
- **Session Statistics**: See time saved/used after work sessions
- **Persistent Display**: Stats stay visible in header
- **Teaching Category**: Special --u category with class tags (2a, 2b, etc.)
- **Completed Counter**: Track tasks finished today

### 🗓️ Kanban Week View
Plan your week with a powerful Kanban board:
- **8 Columns**: "Nicht zugewiesen" (unassigned) + Monday through Sunday
- **View Switch Button**: Cycle between Board, Kanban, and Plan
- **Drag & Drop**: Move cards between days to schedule your week
- **Stack Support**: Entire stacks can be moved between days
- **Time Display**: Each column shows total time for that day
- **Smart Counting**: Stacks count only the top card's time

### 🔍 Advanced Filtering
Filter cards across multiple dimensions:
- **Category Filters**: KSWIL, HSLU, Privat
- **Time Filters**: ≤15m, 16-30m, 31-60m, 60m+
- **Day Filters** (Board view only): Filter by assigned day
- **Multi-Select**: Combine filters for precise control
- **Kanban Filtering**: Time/category filters work in Kanban too

### 🎯 Focus Mode & Work Timer
Stay productive with built-in time management:
- **Focus Cards**: Mark cards as "active" for focused work
- **Work Sidebar**: Shows total time for focused cards
- **Countdown Timer**: Start work timer for time-boxed sessions
- **Visual Highlighting**: Focused cards get colored backgrounds

### 📦 Automatic Backup System
Never lose your data:
- **Choose Backup Folder**: Select where backups are saved
- **Auto-Backup**: Automatic backups every 5 minutes
- **Manual Backup**: Create backups on demand
- **Import Backup**: Restore from any backup file
- **IndexedDB Persistence**: Folder selection persists across sessions

### 📚 Stack Types
Two types of stacks for different workflows:
- **Group Stacks** (+): Collection of related tasks (all cards active)
- **Sequential Stacks** (→): Workflow with one active task at a time
- **Visual Indicators**: Different badges for each type
- **Smart Filtering**: Sequential stacks show only the active card in filters

### ✅ Card Editing
Cards can now be edited after creation:
- Click the **⋮** menu on any card to edit
- Modify content, time estimates, and categories
- Same parsing logic as creating new cards

### ✅ Stack Modal Management
Enhanced stack interaction with dedicated modal:
- Click stack badge to open management modal
- View all cards in the stack clearly
- Reorder cards with **↑↓** arrow buttons
- Remove cards from stack with **⇢** button
- Edit, delete, or complete cards within the modal
- Set stack title and toggle stack type

## Planned Features

### Active Card Selection
- **Select/Track Cards**: Mark specific cards as "active" to track them
- **Custom Ordering**: Arrange active cards in a specific sequence
- **Filtered Time Display**: Show time totals only for selected cards
- **Tag Planning**: Assign dates or tags to active cards for scheduling

### Pomodoro Timer
- **Integrated Timer**: Built-in Pomodoro timer for time-boxed work
- **Card Integration**: Link timer to specific cards
- **Session Tracking**: Track completed Pomodoro sessions per card
- **Break Reminders**: Automatic short and long break notifications

## License

MIT License - Feel free to use and modify as needed.

## Credits

Developed with Claude Code - AI-powered development assistant.
