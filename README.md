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
- `--h` → Orange border (e.g., high priority)
- `--p` → Violet border (e.g., projects)

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
- **k:** Total time for turquoise cards
- **h:** Total time for orange cards
- **p:** Total time for violet cards
- **other:** Total time for untagged cards
- **total:** Sum of all times

### Card Actions
- **×** (left): Delete card with fade animation
- **○** (right): Mark as complete (removes card with fade animation)

## Usage

### Creating Notes
1. Type your note in the input field at the bottom
2. Optionally add time: `Task name 30m`
3. Optionally add category: `Task name 30m --k`
4. Press **Enter** to create
5. Press **ESC** to clear input

### Organizing with Stacks
1. Create multiple notes
2. Drag one card onto another
3. The cards form a stack
4. Continue adding cards to the stack by dragging onto it
5. Hover over stacked cards to see them

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

- `Enter` - Save note
- `ESC` - Clear input field

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

### Creating a Stack
1. Create: `Backend API 60m --k`
2. Create: `Frontend integration 45m --k`
3. Create: `Testing 30m --k`
4. Drag all three onto each other
5. Top card shows: `135m` in white

## License

MIT License - Feel free to use and modify as needed.

## Credits

Developed with Claude Code - AI-powered development assistant.
