const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class Store {
  constructor() {
    const userDataDir = path.join(app.getPath('appData'), 'DraunEInkMusicPlayer');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    this.storePath = path.join(userDataDir, 'draun-library.json');
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(raw);

        // Strip out any phantom/mock tracks that have no real file path on disk
        if (parsed.tracks && Array.isArray(parsed.tracks)) {
          parsed.tracks = parsed.tracks.filter(t => t.filePath && fs.existsSync(t.filePath));
          // Deduplicate by filePath (normalize separators)
          const seenPaths = new Set();
          parsed.tracks = parsed.tracks.filter(t => {
            const key = (t.filePath || '').replace(/\\/g, '/').toLowerCase();
            if (seenPaths.has(key)) return false;
            seenPaths.add(key);
            return true;
          });
        }


        // Rebuild album list from surviving real tracks (de-duplicate by title)
        if (parsed.tracks && parsed.tracks.length > 0) {
          const folderMap = new Map();
          parsed.tracks.forEach(t => {
            const key = t.folderName || t.album || 'Imported';
            if (!folderMap.has(key)) folderMap.set(key, []);
            folderMap.get(key).push(t);
          });
          const seenTitles = new Set();
          const cleanAlbums = [];
          (parsed.albums || []).forEach(a => {
            if (!seenTitles.has(a.title) && folderMap.has(a.title)) {
              seenTitles.add(a.title);
              cleanAlbums.push({ ...a, tracks: folderMap.get(a.title) });
            }
          });
          // Add any folders not already represented as albums
          folderMap.forEach((trks, fName) => {
            if (!seenTitles.has(fName)) {
              seenTitles.add(fName);
              const first = trks[0];
              cleanAlbums.push({
                id: `alb-${fName}`,
                title: fName,
                artist: first?.artist || 'Local Artist',
                artistId: 'art-local',
                year: first?.year || new Date().getFullYear(),
                genre: first?.genre || 'Imported',
                cover: first?.cover,
                tracks: trks
              });
            }
          });
          parsed.albums = cleanAlbums;
        }

        return parsed;
      }
    } catch (e) {
      console.warn('Draun store load notice:', e);
    }
    return {
      tracks: [],
      albums: [],
      folders: [],
      playlists: [],
      history: [],
      settings: null,
      lastTrackId: null
    };
  }


  saveData(newData) {
    try {
      this.data = { ...this.data, ...newData };
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Draun store save error:', e);
      return false;
    }
  }

  getData() {
    return this.data;
  }
}

function scanDirectoryForAudio(dirPath, maxDepth = 5, currentDepth = 0) {
  let audioFiles = [];
  if (!dirPath || !fs.existsSync(dirPath) || currentDepth > maxDepth) return audioFiles;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // Skip hidden system folders
        if (entry.name.startsWith('.') || entry.name.startsWith('$') || entry.name === 'AppData') continue;
        audioFiles = audioFiles.concat(scanDirectoryForAudio(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.opus'].includes(ext)) {
          audioFiles.push({
            name: entry.name,
            fullPath: fullPath,
            folderName: path.basename(dirPath)
          });
        }
      }
    }
  } catch (e) {
    // Skip unreadable files/folders
  }
  return audioFiles;
}

module.exports = { Store, scanDirectoryForAudio };
