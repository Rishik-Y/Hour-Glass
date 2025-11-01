# Quick Start Guide - TimeTracker Storage

## What's New?

Your TimeTracker now has:
- ✅ **Encrypted local storage** (AES-256-CBC)
- ✅ **Automatic sync every 30 seconds** when online
- ✅ **Offline support** - data stored locally until internet is available
- ✅ **No data loss** - everything is preserved

## Key Features

### Automatic Behavior (No code changes needed!)

When you call `window.TimeTracker.start()`, the system automatically:

1. **Tracks active windows** (as before)
2. **Saves data locally** every 30 seconds (NEW)
3. **Checks internet connectivity** (NEW)
4. **Uploads to server when online** (NEW - needs your server URL)
5. **Clears local file after successful upload** (NEW)

### New Methods Available

```typescript
// Check if local storage is empty
const isEmpty = await window.TimeTracker.isStorageEmpty();

// Read all stored entries
const entries = await window.TimeTracker.readStoredEntries();

// Manually save to local file
await window.TimeTracker.saveData();

// Manually trigger sync to server
await window.TimeTracker.sendData();

// Clear local storage
await window.TimeTracker.clearStorage();
```

## File Locations

Your data is stored at:
- **Windows**: `%APPDATA%\winapp\timetracker_data.enc`
- **macOS**: `~/Library/Application Support/winapp/timetracker_data.enc`
- **Linux**: `~/.config/winapp/timetracker_data.enc`

## To Connect Your Server

Edit `src/electron/main.ts`, find the `sendToServer()` method (around line 200), and replace with:

```typescript
private async sendToServer(entries: TimeEntry[]): Promise<boolean> {
  try {
    const response = await fetch('https://your-server.com/api/timeentries', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN' // Add if needed
      },
      body: JSON.stringify(entries)
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending to server:', error);
    return false;
  }
}
```

Then rebuild: `npm run build`

## Testing

1. **Start the app**: The tracking begins automatically
2. **Check console logs**: You'll see messages like:
   - "TimeTracker initialized with storage at: /path/to/file"
   - "Auto-sync started (30 second interval)"
   - "Saved X entries to local storage"
   - "Online - attempting to sync with server"
   - "Successfully synced to server and cleared local storage"

3. **Test offline mode**: 
   - Disconnect internet
   - Let it run for a minute
   - Reconnect internet
   - Watch logs - data will sync automatically within 30 seconds

## Security

- All data is encrypted with AES-256-CBC
- Encryption key is unique per installation
- Files have restricted permissions (0600)
- Data is never stored in plain text

## Need Help?

- See `FILE_STORAGE_README.md` for detailed documentation
- See `IMPLEMENTATION_SUMMARY.md` for technical details
- Check console logs for debugging information

## No Breaking Changes!

All existing code continues to work exactly as before. The new storage system runs automatically in the background!
