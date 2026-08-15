const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { NativeAudioEngine } = require('./audio/NativeAudioEngine.cjs');

const { Store, scanDirectoryForAudio } = require('./store.cjs');

// Remove application menu bar completely
Menu.setApplicationMenu(null);

// Instantiate Centralized Native Windows Audio Engine & Persistent Library Store
const nativeAudioEngine = new NativeAudioEngine();
const libraryStore = new Store();

// Configure permanent user data directory
try {
  const userDataDir = path.join(app.getPath('appData'), 'DraunEInkMusicPlayer');
  app.setPath('userData', userDataDir);
} catch (e) {}

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.exit(0);
}

let mainWindow = null;
let splashWindow = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 320,
    height: 380,
    frame: false,
    transparent: false,
    backgroundColor: '#EEEEEE',
    resizable: false,
    alwaysOnTop: true,
    center: true,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  let splashPath = path.join(__dirname, 'splash.html');
  if (!fs.existsSync(splashPath)) {
    splashPath = path.join(__dirname, '../electron/splash.html');
  }

  if (fs.existsSync(splashPath)) {
    splashWindow.loadFile(splashPath);
  }
}

function createWindow() {
  createSplashWindow();

  mainWindow = new BrowserWindow({
    width: 440,
    height: 750,
    minWidth: 380,
    minHeight: 650,
    frame: false,
    transparent: false,
    backgroundColor: '#EEEEEE',
    title: 'DRAUN by i.am.krs',
    show: false,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  mainWindow.setMenu(null);

  let distIndexPath = path.join(__dirname, '../dist/index.html');
  if (!fs.existsSync(distIndexPath)) {
    distIndexPath = path.join(__dirname, 'dist/index.html');
  }

  if (fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath);
  } else {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    mainWindow.loadURL(devServerUrl).catch(() => {
      mainWindow.loadFile(distIndexPath);
    });
  }

  const splashTimer = setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();

      // Automatically scan OS Music directory on launch
      try {
        const musicDir = app.getPath('music');
        const scannedFiles = scanDirectoryForAudio(musicDir);
        if (scannedFiles && scannedFiles.length > 0) {
          mainWindow.webContents.send('auto-scanned-music', scannedFiles);
        }
      } catch (err) {}
    }
  }, 1600);

  mainWindow.on('closed', () => {
    if (splashTimer) clearTimeout(splashTimer);
    mainWindow = null;
  });
}

// Forward Native Audio Engine Events to Renderer UI
nativeAudioEngine.onStatusUpdate((status) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('audio-status-changed', status);
  }
});

nativeAudioEngine.onTimeUpdate((currentTime, duration) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('audio-time-changed', { currentTime, duration });
  }
});

nativeAudioEngine.onEnded(() => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('audio-ended');
  }
});

// IPC Persistent Library Store & Auto Music Scanner Handlers
ipcMain.handle('library-save', (event, data) => {
  return libraryStore.saveData(data);
});

ipcMain.handle('library-load', () => {
  return libraryStore.getData();
});

ipcMain.handle('music-folder-scan', () => {
  try {
    const musicDir = app.getPath('music');
    return scanDirectoryForAudio(musicDir);
  } catch (e) {
    return [];
  }
});

// IPC Audio API Handlers
ipcMain.handle('audio-play', (event, track) => {
  nativeAudioEngine.play(track);
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-pause', () => {
  nativeAudioEngine.pause();
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-resume', () => {
  nativeAudioEngine.resume();
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-stop', () => {
  nativeAudioEngine.stop();
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-seek', (event, seconds) => {
  nativeAudioEngine.seek(seconds);
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-set-volume', (event, volPercent) => {
  nativeAudioEngine.setVolume(volPercent);
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-set-output-mode', (event, mode) => {
  nativeAudioEngine.setOutputMode(mode);
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-set-direct-output', (event, enabled) => {
  nativeAudioEngine.setDirectOutput(enabled);
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-set-replaygain', (event, mode) => {
  nativeAudioEngine.setReplayGain(mode);
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-set-buffer-mode', (event, mode) => {
  nativeAudioEngine.setBufferMode(mode);
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-set-device', (event, deviceId) => {
  nativeAudioEngine.setOutputDevice(deviceId);
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-get-status', () => {
  return nativeAudioEngine.getAudioStatus();
});

ipcMain.handle('audio-get-devices', () => {
  return nativeAudioEngine.getAudioDevices();
});

// Window Control IPC Handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('set-mini-player', (event, isMini) => {
  if (mainWindow) {
    if (isMini) {
      mainWindow.setMinimumSize(380, 360);
      mainWindow.setSize(440, 380, true);
    } else {
      mainWindow.setMinimumSize(380, 650);
      mainWindow.setSize(440, 750, true);
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
  app.exit(0);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  app.exit(0);
});
