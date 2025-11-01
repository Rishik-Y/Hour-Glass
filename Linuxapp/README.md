# Hour-Glass Linux Time Tracker

This is the Linux version of the Hour-Glass time tracking application. It tracks which applications you're using and for how long, similar to the Windows version.

## Requirements

### System Requirements
- **X11 (X.org) display server** - **REQUIRED**
- **NOT compatible with Wayland**

### Required System Tools
The following command-line tools must be installed:

1. **xdotool** - For detecting active windows on X11
   ```bash
   # Ubuntu/Debian
   sudo apt install xdotool
   
   # Fedora
   sudo dnf install xdotool
   
   # Arch Linux
   sudo pacman -S xdotool
   
   # openSUSE
   sudo zypper install xdotool
   ```

### Switching from Wayland to X11

#### KDE Plasma
1. Log out of your current session
2. At the login screen, click on the session selector (usually bottom-left)
3. Select "Plasma (X11)" instead of "Plasma (Wayland)"
4. Log in

#### GNOME
1. Log out of your current session
2. At the login screen, click the gear icon (⚙️) next to the "Sign In" button
3. Select "GNOME on Xorg" instead of "GNOME"
4. Log in

#### Verification
You can verify you're running X11 with:
```bash
echo $XDG_SESSION_TYPE
# Should output: x11
```

## Installation

1. Install dependencies:
   ```bash
   cd Linuxapp
   npm install
   ```

2. Make sure xdotool is installed (see above)

3. Make sure you're running X11 (see above)

## Development

Run in development mode:
```bash
npm run dev
```

This will:
- Start the Vite development server for the UI (port 5173)
- Compile the Electron TypeScript code
- Launch the Electron app

## Building

Build for production:
```bash
npm run build
```

Create a distributable package:
```bash
npm run dist:linux
```

## How It Works

The app uses `xdotool` to query the X11 server for the currently active window. It:
1. Gets the active window ID
2. Retrieves the window title
3. Finds the process ID (PID) of the window
4. Reads process information from `/proc` to get the application name

This approach is:
- Simple and reliable
- Works on all X11-based desktop environments (KDE, GNOME, XFCE, etc.)
- Does NOT work on Wayland (by design - Wayland doesn't expose this information)

## Troubleshooting

### "xdotool: command not found"
Install xdotool using the commands in the Requirements section above.

### App shows "Unknown" for all windows
This means:
1. You're running Wayland instead of X11 - **Switch to X11** (see above)
2. xdotool is not installed - **Install xdotool** (see above)
3. You don't have permission to query X11 - Check your X11 permissions

### How to check if you're on Wayland or X11
Run this command:
```bash
echo $XDG_SESSION_TYPE
```
- If it says `x11` → You're good ✓
- If it says `wayland` → You need to switch to X11 (see above)

### Electron errors during development
Make sure all dependencies are installed:
```bash
npm install
```

## Data Storage

Time tracking data is saved to:
```
~/.config/linuxapp/time-tracking-data.json
```

The app automatically:
- Saves data every 30 seconds while running
- Saves on app close
- Loads previous data on startup

## Features

- Real-time tracking of active applications
- Tracks application name, window title, and duration
- Automatic data persistence
- Statistics and analytics
- Export functionality (coming soon)
- Server synchronization (coming soon)

## Architecture

- **Frontend**: React + Vite
- **Backend**: Electron (Node.js)
- **Window Detection**: xdotool (X11 command-line tool)
- **Process Info**: Linux /proc filesystem

## Comparison with Windows Version

| Feature | Windows (winapp) | Linux (Linuxapp) |
|---------|------------------|------------------|
| Window Detection | `active-win` npm package | `xdotool` CLI tool |
| Display Server | Windows API | X11 only |
| Process Info | Windows API | /proc filesystem |
| UI | React | React (same) |
| Framework | Electron | Electron (same) |

## License

Same as the main Hour-Glass project.

