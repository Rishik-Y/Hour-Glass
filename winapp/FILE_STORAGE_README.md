# TimeTracker File Storage System

## Overview

The TimeTracker class now includes a robust encrypted file storage system that automatically manages local data persistence and syncing with a server. This system ensures no data loss even when the application is offline and automatically syncs when connectivity is restored.

## Features

### 1. **Encrypted Local Storage**
- All time tracking data is stored locally in an encrypted format using AES-256-CBC encryption
- Encryption key is automatically generated and securely stored in the user data directory
- Data is stored in append-only mode to preserve historical records

### 2. **Automatic Syncing**
- Every 30 seconds, the system automatically:
  - Saves in-memory entries to the encrypted local file
  - Checks internet connectivity
  - If online: uploads all local data to the server and clears the local file after successful upload
  - If offline: data remains in local storage until connectivity is restored

### 3. **Network Connectivity Detection**
- Built-in connectivity checking ensures reliable sync operations
- Automatically detects when the system goes online/offline
- No manual intervention required

## File Locations

- **Encrypted Data File**: `{userData}/timetracker_data.enc`
- **Encryption Key**: `{userData}/encryption.key`

Where `{userData}` is the Electron app's user data directory (platform-specific):
- Windows: `%APPDATA%\winapp`
- macOS: `~/Library/Application Support/winapp`
- Linux: `~/.config/winapp`

## API Methods

### Available Methods

#### `start()`
Starts the time tracking process. Automatically initializes the storage system and begins the 30-second auto-sync interval.

```typescript
window.TimeTracker.start();
```

#### `stop()`
Stops the time tracking and auto-sync processes. Saves any remaining entries before stopping.

```typescript
window.TimeTracker.stop();
```

#### `sendData()`
Manually triggers a sync operation. Useful for forcing an immediate upload to the server.

```typescript
await window.TimeTracker.sendData();
```

#### `saveData()`
Manually saves current in-memory entries to the local encrypted file without attempting to sync with the server.

```typescript
await window.TimeTracker.saveData();
```

#### `isStorageEmpty()`
Checks if the local storage file is empty.

```typescript
const isEmpty = await window.TimeTracker.isStorageEmpty();
console.log('Storage is empty:', isEmpty);
```

#### `readStoredEntries()`
Reads and decrypts all entries from the local storage file.

```typescript
const entries = await window.TimeTracker.readStoredEntries();
console.log('Stored entries:', entries);
```

#### `clearStorage()`
Clears all data from the local storage file. Use with caution!

```typescript
await window.TimeTracker.clearStorage();
```

## Data Structure

Each time entry contains the following fields:

```typescript
interface TimeEntry {
  apptitle: string;    // Title of the active window/application
  appname: string;     // Name of the application
  startTime: Date;     // When tracking started for this entry
  endTime: Date;       // When tracking ended for this entry
  duration: number;    // Duration in seconds
}
```

## How It Works

### Normal Operation (Online)

1. User starts the TimeTracker
2. Application tracks active window usage
3. Every 30 seconds:
   - In-memory entries are saved to encrypted local file
   - System checks internet connectivity
   - If online, all local entries are sent to the server
   - Upon successful server upload, local file is cleared
   
### Offline Operation

1. User starts the TimeTracker (no internet connection)
2. Application tracks active window usage normally
3. Every 30 seconds:
   - In-memory entries are appended to encrypted local file
   - System detects offline status
   - Data remains in local storage
4. When internet connection is restored:
   - Next sync cycle automatically uploads all accumulated data
   - Local file is cleared after successful upload

## Security Features

1. **AES-256-CBC Encryption**: Industry-standard encryption for data at rest
2. **Unique Encryption Key**: Each installation generates its own encryption key
3. **Secure Key Storage**: Encryption key stored with restricted file permissions (0600)
4. **IV per Block**: Each encrypted data block uses a unique initialization vector

## Server Integration

The system includes a placeholder for server integration. To connect to your actual server:

1. Open `src/electron/main.ts`
2. Find the `sendToServer()` method in the `TimeTracker` class
3. Replace the placeholder with your actual server API call:

```typescript
private async sendToServer(entries: TimeEntry[]): Promise<boolean> {
  try {
    const response = await fetch('YOUR_SERVER_URL/api/timeentries', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN' // if needed
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

## Error Handling

The system includes comprehensive error handling:
- Failed encryption/decryption operations are logged but don't crash the app
- Network errors are caught and the system continues operating offline
- File I/O errors are handled gracefully
- Corrupted data lines are skipped during reading

## Testing

To test the file storage system:

1. Start the application
2. Let it track for a while
3. Check if file exists:
   ```typescript
   const isEmpty = await window.TimeTracker.isStorageEmpty();
   console.log('Storage empty?', isEmpty);
   ```
4. Read stored data:
   ```typescript
   const entries = await window.TimeTracker.readStoredEntries();
   console.log('Entries:', entries);
   ```
5. Test offline mode by disconnecting from the internet and observing console logs

## Troubleshooting

### Data not being saved
- Check console logs for errors
- Verify the user data directory is writable
- Ensure sufficient disk space

### Encryption key issues
- If the encryption key is lost, old encrypted data cannot be recovered
- Back up the encryption key if needed (though this reduces security)
- Delete both the data file and key file to start fresh

### Sync not working
- Check console logs for network errors
- Verify server endpoint is configured correctly
- Check if the auto-sync interval is running

## Performance Considerations

- The 30-second sync interval is configurable
- Encryption/decryption happens asynchronously to avoid blocking the UI
- File operations use async I/O to maintain application responsiveness
- In-memory cache reduces file I/O operations
