const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  setMiniPlayer: (isMini) => ipcRenderer.send('set-mini-player', isMini)
});

contextBridge.exposeInMainWorld('libraryAPI', {
  saveLibrary: (data) => ipcRenderer.invoke('library-save', data),
  loadLibrary: () => ipcRenderer.invoke('library-load'),
  scanMusicFolder: () => ipcRenderer.invoke('music-folder-scan'),
  onAutoScannedMusic: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('auto-scanned-music', handler);
    return () => ipcRenderer.removeListener('auto-scanned-music', handler);
  }
});

contextBridge.exposeInMainWorld('audioAPI', {
  play: (track) => ipcRenderer.invoke('audio-play', track),
  pause: () => ipcRenderer.invoke('audio-pause'),
  resume: () => ipcRenderer.invoke('audio-resume'),
  stop: () => ipcRenderer.invoke('audio-stop'),
  seek: (seconds) => ipcRenderer.invoke('audio-seek', seconds),
  setVolume: (volPercent) => ipcRenderer.invoke('audio-set-volume', volPercent),
  setOutputMode: (mode) => ipcRenderer.invoke('audio-set-output-mode', mode),
  setDirectOutput: (enabled) => ipcRenderer.invoke('audio-set-direct-output', enabled),
  setReplayGain: (mode) => ipcRenderer.invoke('audio-set-replaygain', mode),
  setBufferMode: (mode) => ipcRenderer.invoke('audio-set-buffer-mode', mode),
  setOutputDevice: (deviceId) => ipcRenderer.invoke('audio-set-device', deviceId),
  getAudioStatus: () => ipcRenderer.invoke('audio-get-status'),
  getAudioDevices: () => ipcRenderer.invoke('audio-get-devices'),

  onStatusUpdate: (callback) => {
    const handler = (event, status) => callback(status);
    ipcRenderer.on('audio-status-changed', handler);
    return () => ipcRenderer.removeListener('audio-status-changed', handler);
  },
  onTimeUpdate: (callback) => {
    const handler = (event, data) => callback(data.currentTime, data.duration);
    ipcRenderer.on('audio-time-changed', handler);
    return () => ipcRenderer.removeListener('audio-time-changed', handler);
  },
  onEnded: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('audio-ended', handler);
    return () => ipcRenderer.removeListener('audio-ended', handler);
  }
});
