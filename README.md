# Simple Notes App

A minimalist, terminal-inspired notes and todo management application with advanced features like card stacking, time tracking, and category-based organization.

## Features

### Core Functionality
- **Quick Note Entry**: Create notes instantly with a terminal-style input prompt
- **Card-Based Display**: Notes appear as draggable cards on a canvas
- **Persistent Storage**: All notes are automatically saved to browser localStorage
- **Fade Animations**: Smooth animations when creating or removing cards

### Advanced Features

#### 🎨 Color-Coded Categories
Tag your notes with color categories:
- `--k` → Turquoise border (e.g., critical tasks)
- `--h` → Yellow border (e.g., high priority)
- `--p` → Red border (e.g., projects)

**Example:** `Meeting preparation --k`

#### ⏱️ Time Tracking
Add time estimates to your notes:
- Format: `15m`, `30m`, `125m` (minutes)
- Time displays in the card header
- Automatic time summation in stacks

**Example:** `Write documentation 60m --p`

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

### Kanban Week Planning
Switch to Kanban view to plan your week:

1. **Switch Views**: Click the **⊞ Kanban** button in the header
2. **Drag Cards**: Drag cards from "Nicht zugewiesen" to a weekday
3. **Move Stacks**: Entire stacks can be moved between days
4. **View Time**: Each column shows total time for that day
5. **Apply Filters**: Use time/category filters to focus on specific cards
6. **Edit Cards**: All card actions work in Kanban view
7. **Switch Back**: Click **⊟ Board** to return to board view

The Kanban view is perfect for weekly planning, while Board view is great for daily work.

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

- `Enter` - Save note (or save edit when editing)
- `ESC` - Clear input field (or cancel edit when editing)

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

### 🗓️ Kanban Week View (New!)
Plan your week with a powerful Kanban board:
- **8 Columns**: "Nicht zugewiesen" (unassigned) + Monday through Sunday
- **View Switch Button**: Toggle between Board and Kanban view
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
