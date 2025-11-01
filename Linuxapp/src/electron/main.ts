import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 700,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	if (process.env.NODE_ENV === "development") {
		mainWindow.loadURL("http://localhost:24000");
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(__dirname, "../dist-react/index.html"));
	}

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

interface WindowInfo {
	title: string;
	owner: {
		name: string;
		processId: number;
		path: string;
	};
}

// Try to get active window using multiple methods
// We primarily use command-line tools as they're more reliable on Linux
async function getActiveWindowInfo(): Promise<WindowInfo | null> {
	// Method 1: Try xdotool (X11) - most common and reliable
	try {
		const { stdout: windowId } = await execAsync('xdotool getactivewindow 2>/dev/null');
		if (windowId.trim()) {
			const { stdout: windowTitle } = await execAsync(`xdotool getwindowname ${windowId.trim()} 2>/dev/null`);
			const { stdout: windowPid } = await execAsync(`xdotool getwindowpid ${windowId.trim()} 2>/dev/null`);
			
			// Get process name from pid
			let processName = "Unknown";
			const pid = parseInt(windowPid.trim());
			if (pid && pid > 0) {
				try {
					const { stdout: cmdline } = await execAsync(`cat /proc/${pid}/comm 2>/dev/null`);
					processName = cmdline.trim();
				} catch {}
			}

			return {
				title: windowTitle.trim(),
				owner: {
					name: processName,
					processId: parseInt(windowPid.trim()) || 0,
					path: ""
				}
			};
		}
	} catch (error) {
		// Fall through
	}

	// Method 2: Try @paymoapp/active-window (X11) - as fallback
	try {
		const ActiveWindow = require('@paymoapp/active-window');
		ActiveWindow.initialize();
		const result = ActiveWindow.getActiveWindow();
		if (result && result.title) {
			return {
				title: result.title,
				owner: {
					name: result.application || "Unknown",
					processId: result.pid || 0,
					path: result.path || ""
				}
			};
		}
	} catch (error) {
		// Fall through to other methods
	}

	// Method 3: Try GNOME Shell (Wayland on GNOME)
	try {
		const { stdout } = await execAsync(
			`gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "global.display.focus_window.title" 2>/dev/null`
		);
		const match = stdout.match(/"([^"]+)"/);
		if (match && match[1]) {
			return {
				title: match[1],
				owner: {
					name: "Unknown",
					processId: 0,
					path: ""
				}
			};
		}
	} catch (error) {
		// Fall through
	}

	// Method 4: Try wmctrl (works on X11 and some Wayland compositors)
	try {
		const { stdout } = await execAsync('wmctrl -lp 2>/dev/null');
		if (stdout.trim()) {
			// wmctrl -lp lists windows with format: <windowid> <desktop> <pid> <machine> <title>
			// We get the last active window by assuming it's listed last or we need to find the focused one
			const lines = stdout.trim().split('\n');
			if (lines.length > 0) {
				// Try to find the focused window using wmctrl -a or just use the first one
				const lastLine = lines[lines.length - 1];
				const parts = lastLine.trim().split(/\s+/);
				if (parts.length >= 5) {
					const pid = parseInt(parts[2]);
					const title = parts.slice(4).join(' ');
					
					// Get process name from pid
					let processName = "Unknown";
					if (pid && pid > 0) {
						try {
							const { stdout: cmdline } = await execAsync(`cat /proc/${pid}/comm 2>/dev/null`);
							processName = cmdline.trim();
						} catch {}
					}
					
					return {
						title: title,
						owner: {
							name: processName,
							processId: pid || 0,
							path: ""
						}
					};
				}
			}
		}
	} catch (error) {
		// Fall through
	}

	// Method 5: Try KDE/KWin (Wayland on KDE)
	try {
		const { stdout } = await execAsync(
			`qdbus org.kde.KWin /KWin org.kde.KWin.activeWindow 2>/dev/null`
		);
		if (stdout.trim()) {
			return {
				title: stdout.trim(),
				owner: {
					name: "Unknown",
					processId: 0,
					path: ""
				}
			};
		}
	} catch (error) {
		// Fall through
	}

	return null;
}

interface TimeEntry {
	apptitle: string;
	appname: string;
	startTime: Date;
	endTime: Date;
	duration: number;
}

// Helper: Convert Date to IST string
function toISTString(date: Date): string {
    // IST is UTC+5:30
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffsetMs);
    const yyyy = istDate.getUTCFullYear();
    const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(istDate.getUTCDate()).padStart(2, '0');
    const hh = String(istDate.getUTCHours()).padStart(2, '0');
    const min = String(istDate.getUTCMinutes()).padStart(2, '0');
    const ss = String(istDate.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} IST`;
}

// Helper: Parse IST string back to Date
function parseISTString(str: string): Date {
    // Format: YYYY-MM-DD HH:mm:ss IST
    const match = str.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) IST/);
    if (!match) return new Date(str); // fallback
    const [_, yyyy, mm, dd, hh, min, ss] = match;
    // Construct UTC date, then subtract IST offset
    const utcDate = new Date(Date.UTC(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min),
        Number(ss)
    ));
    // Subtract IST offset to get UTC
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(utcDate.getTime() - istOffsetMs);
}

class TimeTracker {
	private entries: TimeEntry[] = [];
	private currentEntry: TimeEntry | null = null;
	private trackingInterval: NodeJS.Timeout | null = null;
	private dataFilePath: string;
	private saveInterval: NodeJS.Timeout | null = null;

	constructor() {
		const userDataPath = app.getPath('userData');
		this.dataFilePath = path.join(userDataPath, 'time-tracking-data.json');
		this.loadTrackingData();
	}

	public startTracking(intervalMs: number = 200) {
		if (this.trackingInterval) return;

		(async () => {
			const activeWindow = await getActiveWindowInfo();
			const now = new Date();
			this.currentEntry = {
				apptitle: activeWindow?.title || "Unknown",
				appname: activeWindow?.owner.name || "Unknown",
				startTime: now,
				endTime: now,
				duration: 0,
			};
		})();

		this.trackingInterval = setInterval(async () => {
			const activeWindow = await getActiveWindowInfo();
			const now = new Date();

			if (!this.currentEntry) {
				this.currentEntry = {
					apptitle: activeWindow?.title || "Unknown",
					appname: activeWindow?.owner.name || "Unknown",
					startTime: now,
					endTime: now,
					duration: 0,
				};
				return;
			}

			if (this.currentEntry.apptitle === activeWindow?.title) {
				this.currentEntry.endTime = now;
				this.currentEntry.duration = Math.floor((this.currentEntry.endTime.getTime() - this.currentEntry.startTime.getTime()) / 1000);
			} else {
				if (
					this.currentEntry &&
					this.currentEntry.startTime &&
					this.currentEntry.endTime &&
					(this.currentEntry.endTime.getTime() - this.currentEntry.startTime.getTime() > 2000)
				) {
					this.currentEntry.duration = Math.floor((this.currentEntry.endTime.getTime() - this.currentEntry.startTime.getTime()) / 1000);
					this.entries.push(this.currentEntry);
				}
				this.currentEntry = {
					apptitle: activeWindow?.title || "Unknown",
					appname: activeWindow?.owner.name || "Unknown",
					startTime: now,
					endTime: now,
					duration: 0,
				};
			}
		}, intervalMs);

		this.saveInterval = setInterval(() => {
			this.saveTrackingData();
		}, 30000);
	}

	public sendTrackingData() {
		console.log('Sending tracking data to server...');
		return { success: true, message: 'Server sync not yet implemented' };
	}

	public saveTrackingData() {
		try {
			const dataToSave = {
				entries: this.entries.map(entry => ({
					...entry,
					startTime: toISTString(entry.startTime),
					endTime: toISTString(entry.endTime),
				})),
				currentEntry: this.currentEntry ? {
					...this.currentEntry,
					startTime: toISTString(this.currentEntry.startTime),
					endTime: toISTString(this.currentEntry.endTime),
				} : null,
				lastSaved: toISTString(new Date()),
			};
			fs.writeFileSync(this.dataFilePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
			console.log(`Tracking data saved to: ${this.dataFilePath}`);
			return { success: true, filePath: this.dataFilePath };
		} catch (error) {
			console.error('Error saving tracking data:', error);
			return { success: false, error: String(error) };
		}
	}

	private loadTrackingData() {
		try {
			if (fs.existsSync(this.dataFilePath)) {
				const data = JSON.parse(fs.readFileSync(this.dataFilePath, 'utf-8'));
				this.entries = data.entries.map((entry: { apptitle: string; appname: string; startTime: string; endTime: string; duration: number }) => ({
					...entry,
					startTime: parseISTString(entry.startTime),
					endTime: parseISTString(entry.endTime),
				}));
				console.log(`Loaded ${this.entries.length} tracking entries from file`);
			}
		} catch (error) {
			console.error('Error loading tracking data:', error);
		}
	}

	public stopTracking() {
		if (this.trackingInterval) {
			clearInterval(this.trackingInterval);
			this.trackingInterval = null;
		}
		if (this.saveInterval) {
			clearInterval(this.saveInterval);
			this.saveInterval = null;
		}
		if (this.currentEntry) {
			const now = new Date();
			this.currentEntry.endTime = now;
			this.currentEntry.duration = Math.floor((this.currentEntry.endTime.getTime() - this.currentEntry.startTime.getTime()) / 1000);
			if (this.currentEntry.duration > 2) {
				this.entries.push(this.currentEntry);
			}
			this.currentEntry = null;
		}
		this.saveTrackingData();
	}

	public getEntries() {
		return this.entries;
	}

	public getCurrentEntry() {
		return this.currentEntry;
	}

	public getStats() {
		const totalTime = this.entries.reduce((sum, entry) => sum + entry.duration, 0);
		const appStats: { [key: string]: number } = {};

		this.entries.forEach(entry => {
			if (!appStats[entry.appname]) {
				appStats[entry.appname] = 0;
			}
			appStats[entry.appname] += entry.duration;
		});

		return {
			totalEntries: this.entries.length,
			totalTime,
			appStats,
		};
	}

	public clearEntries() {
		this.entries = [];
		this.saveTrackingData();
	}

	public printEntries() {
		for (const entry of this.entries) {
			console.log(`${entry.appname} - ${entry.apptitle}: ${entry.startTime.toISOString()} to ${entry.endTime.toISOString()} (${entry.duration} seconds)`);
		}
	}
}

ipcMain.handle("getCurrentWindow", async () => {
	const result = await getActiveWindowInfo();
	if (result) {
		return result;
	}
	return null;
});

const tracker = new TimeTracker();

ipcMain.handle('TimeTracker:start', () => {
	tracker.startTracking();
	return { success: true };
});

ipcMain.handle('TimeTracker:stop', () => {
	tracker.stopTracking();
	return { success: true };
});

ipcMain.handle('TimeTracker:sendData', () => {
	return tracker.sendTrackingData();
});

ipcMain.handle('TimeTracker:saveData', () => {
	return tracker.saveTrackingData();
});

ipcMain.handle('TimeTracker:printEntries', () => {
	tracker.printEntries();
});

ipcMain.handle('TimeTracker:getEntries', () => {
	return tracker.getEntries();
});

ipcMain.handle('TimeTracker:getCurrentEntry', () => {
	return tracker.getCurrentEntry();
});

ipcMain.handle('TimeTracker:getStats', () => {
	return tracker.getStats();
});

ipcMain.handle('TimeTracker:clearEntries', () => {
	tracker.clearEntries();
	return { success: true };
});

app.on("ready", () => {
	createWindow();
	setTimeout(() => {
		tracker.startTracking();
		console.log('Time tracking started automatically');
	}, 1000);
});

app.on("window-all-closed", () => {
	tracker.stopTracking();
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (mainWindow === null) createWindow();
});

app.on("before-quit", () => {
	tracker.stopTracking();
});
