import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import activeWin from 'active-win';
import { FileStorageManager } from './fileStorage';
import * as http from 'http';


let mainWindow: BrowserWindow | null = null;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 700,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"), // load preload script
		},
	});

	if (process.env.NODE_ENV === "development") {
		mainWindow.loadURL("http://localhost:24000");
		
	} else {
		mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
	}

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

}

class SystemResourceMonitor {
  private currentWindow: { title: string; owner: { name: string } } | null = null;
  private monitorInterval: NodeJS.Timeout | null = null;

  public startMonitoring(intervalMs: number = 100) {
	console.log('Started Monitoring');	

    this.monitorInterval = setInterval(async () => {
      this.currentWindow = await this.setActiveWindowInfo();
	//   console.log(`Active Window: ${this.currentWindow.title} - ${this.currentWindow.owner.name}`);
    }, intervalMs);
  }

  public stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  private async setActiveWindowInfo() {
    try {
      const result = await activeWin();
      return result ?? { title: "Unknown", owner: { name: "Unknown" } };
    } catch (err) {
      console.error("Error fetching active window:", err);
      return { title: "Error", owner: { name: "Unknown" } };
    }
  }

  public getCurrentWindowInfo() {
    return this.currentWindow;
  }
}


interface TimeEntry {
	apptitle: string;
	appname: string;
	startTime: Date;
	endTime: Date;
	duration: number;
}

class TimeTracker {
	private entries: TimeEntry[] = [];
	private currentEntry: TimeEntry | null = null;
	private trackingInterval: NodeJS.Timeout | null = null;
	private syncInterval: NodeJS.Timeout | null = null;
	private sm: SystemResourceMonitor;
	private storage: FileStorageManager;
	private isSyncing: boolean = false;

	constructor(sys:SystemResourceMonitor) {
		this.sm = sys;
		this.storage = new FileStorageManager();
		console.log(`TimeTracker initialized with storage at: ${this.storage.getFilePath()}`);
		
		// Start auto-sync interval (30 seconds)
		this.startAutoSync();
	}

	/**
	 * Check if we have internet connectivity
	 */
	private async checkOnlineStatus(): Promise<boolean> {
		return new Promise((resolve) => {
			// Try to make a simple HEAD request to a reliable server
			const options = {
				method: 'HEAD',
				host: 'www.google.com',
				port: 80,
				path: '/',
				timeout: 5000
			};

			const req = http.request(options, (res) => {
				resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
			});

			req.on('error', () => {
				resolve(false);
			});

			req.on('timeout', () => {
				req.destroy();
				resolve(false);
			});

			req.end();
		});
	}

	/**
	 * Start auto-sync interval
	 */
	private startAutoSync(): void {
		// Sync every 30 seconds
		this.syncInterval = setInterval(async () => {
			await this.autoSync();
		}, 30000);
		
		console.log('Auto-sync started (30 second interval)');
	}

	/**
	 * Auto-sync: save to local file and send to server if online
	 */
	private async autoSync(): Promise<void> {
		if (this.isSyncing) {
			console.log('Sync already in progress, skipping...');
			return;
		}

		try {
			this.isSyncing = true;

			// Save current in-memory entries to local file
			if (this.entries.length > 0) {
				await this.storage.appendEntries(this.entries);
				console.log(`Saved ${this.entries.length} entries to local storage`);
				this.entries = []; // Clear in-memory entries after saving
			}

			// Check if online
			const isOnline = await this.checkOnlineStatus();
			
			if (isOnline) {
				console.log('Online - attempting to sync with server');
				
				// Check if there's data in local file
				const isEmpty = await this.storage.isEmpty();
				
				if (!isEmpty) {
					// Read all entries from local file
					const allEntries = await this.storage.readEntries();
					
					if (allEntries.length > 0) {
						console.log(`Found ${allEntries.length} entries to sync to server`);
						
						// Send to server
						const success = await this.sendToServer(allEntries);
						
						if (success) {
							// Clear local file after successful upload
							await this.storage.clearFile();
							console.log('Successfully synced to server and cleared local storage');
						} else {
							console.log('Failed to sync to server, keeping local data');
						}
					}
				}
			} else {
				console.log('Offline - data saved to local storage only');
			}
		} catch (error) {
			console.error('Error during auto-sync:', error);
		} finally {
			this.isSyncing = false;
		}
	}

	/**
	 * Send entries to server (placeholder - implement actual server logic)
	 */
	private async sendToServer(entries: TimeEntry[]): Promise<boolean> {
		// TODO: Implement actual server upload logic here
		// For now, just simulate the behavior
		console.log(`Sending ${entries.length} entries to server (placeholder)`);
		
		try {
			// Simulate server call
			// Replace this with actual HTTP request to your server
			// Example:
			// const response = await fetch('YOUR_SERVER_URL/api/timeentries', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify(entries)
			// });
			// return response.ok;
			
			return true; // Simulate success for now
		} catch (error) {
			console.error('Error sending to server:', error);
			return false;
		}
	}

	public startTracking(intervalMs: number = 200) {
		console.log(`TimeTracker started with interval ${intervalMs} ms`);
		this.trackingInterval = setInterval(async () => {
			const activeWindow = this.sm.getCurrentWindowInfo();
			const now = new Date();

			if (!this.currentEntry){
				console.log(`No current entry, initializing new entry for ${activeWindow?.title}`);
				if(activeWindow && activeWindow.title !== "Unknown"){
					this.currentEntry = {
						apptitle: activeWindow?.title || "Unknown",
						appname: activeWindow?.owner.name || "Unknown",
						startTime: now,
						endTime: now,
						duration: 0,
					};
				}
				return;
			}

			if (this.currentEntry.apptitle === activeWindow?.title) {
				this.currentEntry.endTime = now;
				// console.log(`Updated current entry endTime to ${now.toISOString()} for ${this.currentEntry.apptitle}`);
				// this.currentEntry.duration = (this.currentEntry.endTime.getTime() - this.currentEntry.startTime.getTime()) / 1000;
			} else {
				if (
					this.currentEntry &&
					this.currentEntry.startTime &&
					this.currentEntry.endTime &&
					(this.currentEntry.endTime.getTime() - this.currentEntry.startTime.getTime() > 2000)
				) {
					this.currentEntry.duration = (this.currentEntry.endTime.getTime() - this.currentEntry.startTime.getTime()) / 1000;
					console.log(`Pushing entry: ${this.currentEntry.appname}\n\t duration: ${this.currentEntry.duration} seconds`);
					this.entries.push(this.currentEntry);
				


					this.currentEntry = {
						apptitle: activeWindow?.title || "Unknown",
						appname: activeWindow?.owner.name || "Unknown",
						startTime: now,
						endTime: now,
						duration: 0,
					};
				}
			}
		}, intervalMs);
	}

	/**
	 * Manually send tracking data to server
	 */
	public async sendTrackingData(): Promise<void> {
		await this.autoSync();
	}

	/**
	 * Manually save tracking data to local file
	 */
	public async saveTrackingData(): Promise<void> {
		if (this.entries.length > 0) {
			await this.storage.appendEntries(this.entries);
			console.log(`Manually saved ${this.entries.length} entries to local storage`);
			this.entries = [];
		}
	}

	/**
	 * Check if local storage file is empty
	 */
	public async isStorageEmpty(): Promise<boolean> {
		return await this.storage.isEmpty();
	}

	/**
	 * Read all entries from local storage
	 */
	public async readStoredEntries(): Promise<TimeEntry[]> {
		return await this.storage.readEntries();
	}

	/**
	 * Clear local storage file
	 */
	public async clearStorage(): Promise<void> {
		await this.storage.clearFile();
	}

	public stopTracking() {
		if (this.trackingInterval) {
			clearInterval(this.trackingInterval);
			this.trackingInterval = null;
		}
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
			this.syncInterval = null;
		}
		if (this.currentEntry) {
			this.entries.push(this.currentEntry);
			this.currentEntry = null;
		}
		// Save any remaining entries before stopping
		if (this.entries.length > 0) {
			this.saveTrackingData();
		}
	}

	public printEntries() {
		for (const entry of this.entries) {
			console.log(`${entry.appname} - ${entry.apptitle}: ${entry.startTime.toISOString()} to ${entry.endTime.toISOString()} (${entry.duration} seconds)`);
		}
	}
}


const monitor = new SystemResourceMonitor();

const tracker = new TimeTracker(monitor);


ipcMain.handle("getCurrentWindow", async () => {
	return await monitor.getCurrentWindowInfo();
})
ipcMain.handle("getCurrentWindow:start", () => {
	monitor.startMonitoring();
});
ipcMain.handle("getCurrentWindow:stop", () => {
	monitor.stopMonitoring();
});




ipcMain.handle('TimeTracker:start', () => {
	tracker.startTracking();
});
ipcMain.handle('TimeTracker:stop', () => {
	tracker.stopTracking();
});
ipcMain.handle('TimeTracker:sendData', async () => {
	await tracker.sendTrackingData();
});
ipcMain.handle('TimeTracker:saveData', async () => {
	await tracker.saveTrackingData();
});
ipcMain.handle('TimeTracker:printEntries', () => {
	tracker.printEntries();
});
ipcMain.handle('TimeTracker:isStorageEmpty', async () => {
	return await tracker.isStorageEmpty();
});
ipcMain.handle('TimeTracker:readStoredEntries', async () => {
	return await tracker.readStoredEntries();
});
ipcMain.handle('TimeTracker:clearStorage', async () => {
	await tracker.clearStorage();
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
	tracker.stopTracking();
	monitor.stopMonitoring();
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (mainWindow === null) createWindow();
});