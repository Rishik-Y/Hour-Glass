# Linux Application Build Guide

This is the Linux version of the Hour-Glass time tracking application, designed to work on Linux systems with both X11 and Wayland display servers.

## Features

- **Cross-display server support**: Works on both X11 and Wayland
- **Active window tracking**: Monitors the currently active application and window title
- **Time tracking**: Records time spent in each application
- **Data persistence**: Saves tracking data locally in JSON format
- **Automatic tracking**: Starts tracking automatically when the app launches

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

### Native addon build fails

If `@paymoapp/active-window` fails to build:
1. Install build tools (see Prerequisites)
2. The app will fall back to command-line tools
3. Ensure xdotool is installed as a fallback

### Electron fails to start

1. Check that Frontend dependencies are installed: `cd ../Frontend && npm install`
2. Verify Node.js version is 18 or higher: `node --version`
3. Try cleaning: `rm -rf node_modules package-lock.json && npm install`

### Wayland detection not working

Wayland support is limited:
- GNOME: Ensure GNOME Shell is running
- KDE: Ensure KWin is running
- Other compositors: May not be supported, consider using XWayland compatibility layer

## Development Notes

For a more modular system:
- Frontend code is in the `ui` directory
- System interaction code is in the `electron` directory
- The frontend communicates with the backend via IPC (Inter-Process Communication)

## Comparison with Windows App

This Linux app mirrors the functionality of the Windows app (`winapp`):
- Same time tracking logic
- Same data format (compatible for cross-platform use)
- Same UI framework (Electron + React)
- Same auto-start behavior
- Same data persistence strategy

The main differences are in the window detection methods, which are platform-specific.

## License

Same as the main Hour-Glass project.
