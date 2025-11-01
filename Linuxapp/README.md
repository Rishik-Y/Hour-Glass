# Linux Application Build Guide

This is the Linux version of the Hour-Glass time tracking application. **Requires X11 (X.org) display server.**

## ⚠️ IMPORTANT: X11 Required

**This application requires X11 (X.org) to function properly.**

- ✅ **X11 (X.org)**: Fully supported
- ❌ **KDE Plasma Wayland**: NOT supported
- ⚠️ **GNOME Wayland**: May work (untested)

### For KDE Plasma Users on Wayland

You MUST switch to X11 session:
1. Log out of your current session
2. At the login screen, look for a session selector (usually bottom-left or gear icon)
3. Select **"Plasma (X11)"** instead of "Plasma (Wayland)"
4. Log in
5. Run the app - it will now work!

### Why X11 Only?

Wayland's security model prevents applications from detecting active windows. This is a Wayland design choice, not an app limitation. KDE Plasma on Wayland does not expose the necessary APIs for window tracking.

## Quick Start

### System Compatibility Check

Before installing, you can check if your system has all required dependencies:
```bash
./check-system.sh
```

This script will verify:
- Display server (X11/Wayland)
- Node.js and npm versions
- Window detection tools
- Build tools for native addons

### Installation for Ubuntu/Debian

**Prerequisites**: Must be running X11 session (not Wayland)

For most Ubuntu/Debian users:
```bash
# Install system dependencies
sudo apt install xdotool wmctrl build-essential python3

# Install Node.js dependencies
npm install

# Test the application
npm run dev
```

### Installation for Fedora

**Prerequisites**: Must be running X11 session (not Wayland)

For Fedora users:
```bash
# Install system dependencies
sudo dnf install xdotool wmctrl gcc-c++ make python3

# Install Node.js dependencies
npm install

# Test the application
npm run dev
```

## Features

- **X11 (X.org) support**: Full window detection and tracking on X11
- **Active window tracking**: Monitors the currently active application and window title
- **Time tracking**: Records time spent in each application
- **Data persistence**: Saves tracking data locally in JSON format
- **Automatic tracking**: Starts tracking automatically when the app launches

## Display Server Support

### Supported
- ✅ **X11 (X.org)**: Full support with multiple detection methods
  - xdotool (primary)
  - @paymoapp/active-window (fallback)
  - wmctrl (alternative)

### Partially Supported (Experimental)
- ⚠️ **GNOME on Wayland**: May work via D-Bus (requires testing)

### Not Supported
- ❌ **KDE Plasma on Wayland**: Window detection blocked by Wayland security model
- ❌ **Other Wayland compositors**: Generally not supported

**Recommendation**: Use X11 for reliable window tracking.

## Display Server Support

The application attempts to detect active windows using multiple methods:

### X11 Support (Primary)
- Uses `@paymoapp/active-window` native addon
- Falls back to `xdotool` command-line tool
- Uses `wmctrl` as another fallback

### Wayland Support (Best-effort)
Due to Wayland's security model, active window detection is compositor-specific:
- **GNOME Shell**: Uses `gdbus` to query the Shell interface
- **KDE Plasma**: Uses `qdbus` to query KWin

Note: Wayland support is limited by compositor capabilities and may require additional permissions.

## Prerequisites

### Required Packages

For **X11** systems:
```bash
# Ubuntu/Debian
sudo apt-get install xdotool wmctrl

# Fedora
sudo dnf install xdotool wmctrl

# Arch Linux
sudo pacman -S xdotool wmctrl
```

For **Wayland** systems (depending on your desktop environment):
```bash
# GNOME (usually pre-installed)
# gdbus is part of glib2

# KDE Plasma
sudo apt-get install qttools5-dev-tools  # Ubuntu/Debian
```

### Node.js Dependencies

You need Node.js (version 18 or higher) and npm installed. The application uses:
- TypeScript for type safety
- Electron for the desktop application framework
- React for the UI

## Installation

1. Navigate to the Linuxapp directory:
```bash
cd Linuxapp
```

2. Install dependencies:
```bash
npm install
```

3. If the `@paymoapp/active-window` native addon fails to build, you may need to install build tools:
```bash
# Ubuntu/Debian
sudo apt-get install build-essential python3

# Fedora
sudo dnf install gcc-c++ make python3

# Arch Linux
sudo pacman -S base-devel python
```

## Testing

After installation, you can test the application using:
```bash
npm run dev
```

This command will:
1. Start the React development server (from the Frontend directory)
2. Transpile the TypeScript code
3. Launch the Electron application in development mode

The application window should open and display the currently active window title, updating every 100ms.

### Testing Window Detection

To verify that window tracking is working correctly on your system:

1. **Launch the app**: Run `npm run dev`
2. **Check the app window**: You should see "Active Window Tracker (Linux)" with the currently active window displayed
3. **Switch windows**: Switch to different applications (browser, terminal, etc.)
4. **Verify tracking**: The app should update in real-time to show the new active window

If you see "No active window detected", this means your system configuration needs adjustment (see Troubleshooting below).

### Verifying Data Persistence

1. Run the app for a few minutes while switching between applications
2. Close the app
3. Check the data file: `cat ~/.config/linuxapp/time-tracking-data.json`
4. You should see a JSON file with entries for each window you focused on

### Testing on Different Environments

The app has been designed to work on:
- **Ubuntu/Debian** with X11 or Wayland
- **Fedora** with X11 or Wayland
- **Arch Linux** with X11 or Wayland
- **GNOME** desktop environment (X11 and Wayland)
- **KDE Plasma** desktop environment (X11 and Wayland)
- **Other** X11-based desktop environments

## Building the Application

To build the application for production:
```bash
npm run dist:linux
```

This may take several minutes. The command will:
1. Build the React frontend
2. Transpile the Electron TypeScript code
3. Package everything into a distributable format

The output will be in the `dist` directory as:
- AppImage (portable, works on most distributions)
- .deb package (for Debian/Ubuntu-based systems)

## Running the Built Application

After building:
- Run the AppImage: `./dist/HourGlass-Linux-*.AppImage`
- Install the .deb: `sudo dpkg -i dist/hourglass-linux_*.deb`

## Directory Structure

```
Linuxapp/
├── src/
│   ├── electron/          # Electron main process code
│   │   ├── main.ts        # Main entry point, window tracking logic
│   │   ├── preload.ts     # Preload script for IPC
│   │   ├── util.ts        # Utility functions
│   │   └── tsconfig.json  # TypeScript config for Electron
│   └── ui/                # React UI code
│       ├── App.tsx        # Main React component
│       ├── App.css        # Component styles
│       ├── main.tsx       # React entry point
│       ├── index.css      # Global styles
│       └── global.d.ts    # TypeScript declarations
├── package.json           # Dependencies and scripts
├── tsconfig.json          # Main TypeScript config
├── tsconfig.app.json      # TypeScript config for React
├── tsconfig.node.json     # TypeScript config for Vite
├── vite.config.ts         # Vite bundler configuration
├── electron-builder.json  # Electron builder configuration
├── eslint.config.js       # ESLint configuration
└── README.md              # This file
```

## How It Works

The application uses multiple detection methods in order of preference:

1. **Native addon**: Tries `@paymoapp/active-window` for optimal performance on X11
2. **xdotool**: Command-line X11 tool for window information
3. **GNOME Shell**: D-Bus interface for Wayland/GNOME
4. **wmctrl**: Alternative X11 tool
5. **KDE/KWin**: D-Bus interface for Wayland/KDE

The time tracker:
- Polls active window every 200ms
- Records window changes with timestamps
- Aggregates time spent in each application
- Saves data every 30 seconds
- Stores data in `~/.config/linuxapp/time-tracking-data.json`

## Troubleshooting

### "No active window detected"

This usually means:
1. Required tools are not installed (install xdotool/wmctrl for X11)
2. Running on Wayland without supported compositor
3. Insufficient permissions

**Solutions:**
- **For X11**: Install xdotool and wmctrl: `sudo apt install xdotool wmctrl`
- **For Wayland/GNOME**: The app should work automatically, but ensure GNOME Shell is running
- **For Wayland/KDE**: Ensure qttools5-dev-tools is installed for qdbus
- **Check display server**: Run `echo $XDG_SESSION_TYPE` to verify X11/Wayland

### Native addon build fails

If `@paymoapp/active-window` fails to build:
1. Install build tools (see Prerequisites)
2. The app will fall back to command-line tools
3. Ensure xdotool is installed as a fallback

**Note:** The native addon is optional. The app works perfectly fine with just command-line tools.

### Electron fails to start

1. Check that Frontend dependencies are installed: `cd ../Frontend && npm install`
2. Verify Node.js version is 18 or higher: `node --version`
3. Try cleaning: `rm -rf node_modules package-lock.json && npm install`

### Wayland detection not working

Wayland support is limited by compositor design:
- **GNOME**: Should work automatically via D-Bus
- **KDE**: Requires qdbus to be installed
- **Sway/Other compositors**: May not be supported
- **Workaround**: Use XWayland compatibility layer for X11 apps

### Application crashes on startup

If the app crashes immediately:
1. Check console output for error messages
2. Verify all dependencies are installed
3. Try running in development mode for more detailed logs: `npm run dev`
4. Check that the Frontend is built: `cd ../Frontend && npm run build`

### Time tracking data not saving

1. Check permissions on user data directory: `ls -la ~/.config/linuxapp/`
2. Verify disk space is available
3. Check console logs for save errors
4. Try manually creating the directory: `mkdir -p ~/.config/linuxapp/`

## Development Notes

For a more modular system:
- Frontend code is in the `ui` directory
- System interaction code is in the `electron` directory
- The frontend communicates with the backend via IPC (Inter-Process Communication)

## Comparison with Windows App

This Linux app mirrors the functionality of the Windows app (`winapp`):

### Similarities
- ✓ Same time tracking logic
- ✓ Same data format (compatible for cross-platform use)
- ✓ Same UI framework (Electron + React)
- ✓ Same auto-start behavior
- ✓ Same data persistence strategy (JSON files in user data directory)
- ✓ Same polling interval (200ms for window detection)
- ✓ Same save interval (30 seconds for data persistence)

### Differences
- **Window Detection**: Uses Linux-specific methods instead of Windows APIs
  - Windows: Uses `active-win` package with Windows APIs
  - Linux: Uses xdotool, wmctrl, D-Bus interfaces, and native addons
- **System Requirements**: Requires X11/Wayland tools instead of Windows APIs
- **Build Output**: Creates AppImage and .deb packages instead of .exe
- **Installation Path**: Uses `~/.config/linuxapp/` instead of Windows AppData

### Data Compatibility
The time tracking data format is identical, so you can:
- Transfer data files between Windows and Linux versions
- Use the same analysis tools on data from both platforms
- Aggregate tracking data from multiple systems

## License

Same as the main Hour-Glass project.
