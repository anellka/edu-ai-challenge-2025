# 🕒 Task Time Tracker Chrome Extension

A beautiful and functional Chrome extension to track time spent on various tasks with an intuitive interface and persistent data storage.

## ✨ Features

- **Task Management**: Add, start, pause, and delete tasks
- **Real-time Timer**: Live timer display with seconds precision
- **Persistent Tracking**: Timer continues running even when popup is closed
- **Session History**: Tracks individual work sessions for each task
- **Statistics**: View daily, weekly, and total time statistics
- **Badge Indicator**: Shows elapsed time on extension icon
- **Local Storage**: All data stored locally in Chrome storage
- **Responsive UI**: Clean, modern interface with smooth animations

## 📥 Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Open Chrome Extensions Page**:
   - Go to `chrome://extensions/` in your Chrome browser
   - Or click the three dots menu → More Tools → Extensions

2. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to and select the `time-tracker-extension` folder

4. **Add Icons** (Important):
   - Before loading, add icon files to the `icons/` directory:
     - `icon16.png` (16x16 pixels)
     - `icon32.png` (32x32 pixels) 
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - See `icons/README.md` for icon requirements

5. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Click the pin icon next to "Task Time Tracker"

## 🚀 Usage

### Adding Tasks
1. Click the extension icon to open the popup
2. Type a task name in the input field
3. Click "➕ Add Task" or press Enter

### Starting a Timer
1. Find your task in the task list
2. Click the "▶️ Start" button
3. The timer will begin and display in the current task section

### Managing Active Tasks
- **Pause**: Click "⏸️ Pause" to pause the current timer
- **Stop**: Click "⏹️ Stop" to stop and clear the current task
- **Continue**: After pausing, click "▶️ Start" on the same task to resume

### Viewing Statistics
1. Click "📊 View Statistics" to expand the stats section
2. View:
   - Today's total time
   - This week's total time
   - Total number of tasks

### Deleting Tasks
- Click the "🗑️" button next to any task to delete it
- Warning: This will permanently delete the task and all its time data

## 🎯 Key Features Explained

### Background Tracking
- The timer continues running even when you close the popup
- The extension icon shows a badge with elapsed time
- Data is automatically saved and synchronized

### Session Tracking
- Each start/stop cycle creates a session record
- Sessions include start time, end time, and duration
- Statistics are calculated from all sessions

### Data Persistence
- All data is stored locally using Chrome's storage API
- Your data persists between browser sessions
- No data is sent to external servers

## 🛠️ Technical Details

### Files Structure
```
time-tracker-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI interface
├── popup.css             # Styling
├── popup.js              # Frontend logic
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── README.md
└── README.md            # This file
```

### Technologies Used
- **Manifest V3**: Latest Chrome extension format
- **Chrome Storage API**: For data persistence
- **Service Worker**: Background timer management
- **Modern JavaScript**: ES6+ features and async/await
- **CSS Grid/Flexbox**: Responsive layout
- **Chrome Badge API**: Extension icon indicators

## 🎨 Customization

### Modifying Colors
Edit the CSS variables in `popup.css`:
- Primary colors: `#4299e1`, `#3182ce`
- Secondary colors: `#718096`, `#4a5568`
- Success/Warning/Danger colors as defined

### Adding Features
The modular structure makes it easy to add features:
- Modify `TaskTimeTracker` class in `popup.js`
- Add background logic in `BackgroundTimer` class
- Update UI in `popup.html` and styles in `popup.css`

## 🐛 Troubleshooting

### Extension Not Loading
- Ensure all required files are present
- Check that icon files exist in the `icons/` directory
- Verify manifest.json syntax is correct

### Timer Not Working
- Check Chrome extension permissions
- Ensure background script is running
- Look for errors in Chrome DevTools Console

### Data Not Saving
- Verify Chrome storage permissions in manifest
- Check for storage quota limits
- Ensure proper error handling in console

## 🔒 Privacy

- **Local Only**: All data stored locally in your browser
- **No Network Requests**: Extension works completely offline
- **No Data Collection**: No analytics or tracking
- **No External Dependencies**: Self-contained functionality

## 📝 License

This project is provided as-is for educational and personal use. Feel free to modify and distribute according to your needs.

## 🤝 Contributing

Feel free to submit issues, suggestions, or improvements to enhance the extension's functionality and user experience.

---

**Happy Time Tracking! ⏰** 