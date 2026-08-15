import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Track, Album, Artist, Playlist, FolderPlaylist, DisplayMode, EinkSubMode, AlbumArtMode, 
  DensityLevel, RepeatMode, ViewState, PlayerSettings 
} from '../types/music';
import { MOCK_ALBUMS, MOCK_ARTISTS, MOCK_TRACKS, MOCK_PLAYLISTS } from '../data/mockLibrary';
import { audioEngine, EqPreset, formatAudioUrl } from '../services/audioEngine';
import { resolveAlbumArt } from '../services/albumArtFetcher';
import { autoRecognizeSongMetadata } from '../services/songMetadataRecognizer';
import { fetchOnlineLyrics } from '../services/lyricsFetcher';

interface PlayerContextType {
  // Audio state
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  queueIndex: number;
  history: Track[];

  // DSP Audio & Native WASAPI Engine State
  eqPreset: EqPreset;
  tapeWarmth: boolean;
  spatial3d: boolean;
  audioStatus: any;
  setEqPreset: (preset: EqPreset) => void;
  toggleTapeWarmth: () => void;
  toggleSpatial3d: () => void;
  toggleDirectOutput: () => void;
  toggleOutputMode: () => void;
  toggleReplayGain: () => void;
  
  // Library State
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  folders: FolderPlaylist[];
  favorites: string[];
  
  // UI & View State
  viewState: ViewState;
  activeAlbum: Album | null;
  activeArtist: Artist | null;
  activePlaylist: Playlist | null;
  activeGenre: string | null;
  searchQuery: string;
  gridMode: 'grid' | 'list';
  settings: PlayerSettings;
  isQueueOpen: boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFavorite: (trackId: string) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (newQueue: Track[]) => void;
  clearQueue: () => void;
  
  // Navigation & Settings actions
  setViewState: (view: ViewState) => void;
  openAlbumDetail: (album: Album) => void;
  openArtistDetail: (artist: Artist) => void;
  openPlaylistDetail: (playlist: Playlist) => void;
  openGenreDetail: (genre: string) => void;
  setSearchQuery: (query: string) => void;
  setGridMode: (mode: 'grid' | 'list') => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setEinkSubMode: (subMode: EinkSubMode) => void;
  setArtMode: (mode: AlbumArtMode) => void;
  setDensityLevel: (level: DensityLevel) => void;
  setCrossfade: (seconds: number) => void;
  setIsQueueOpen: (open: boolean) => void;
  toggleArtMode: () => void;
  
  // Playlist actions
  createPlaylist: (name: string, description?: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;

  // Import local audio files & folders
  importLocalFiles: (files: FileList | File[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Library initial data
  const [tracks, setTracks] = useState<Track[]>(MOCK_TRACKS);
  const [albums, setAlbums] = useState<Album[]>(MOCK_ALBUMS);
  const [artists, setArtists] = useState<Artist[]>(MOCK_ARTISTS);
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);
  const [folders, setFolders] = useState<FolderPlaylist[]>([]);
  const [favorites, setFavorites] = useState<string[]>(
    MOCK_TRACKS.filter(t => t.favorite).map(t => t.id)
  );

  // Playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(MOCK_TRACKS.length > 0 ? MOCK_TRACKS[0] : null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(MOCK_TRACKS.length > 0 ? MOCK_TRACKS[0].duration : 0);
  const [volume, setVolumeState] = useState<number>(72);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueueState] = useState<Track[]>(MOCK_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [history, setHistory] = useState<Track[]>([]);

  // Native WASAPI Audio Status State
  const [audioStatus, setAudioStatus] = useState<any>(audioEngine.getAudioStatus());
  const [eqPreset, setEqPresetState] = useState<EqPreset>('warm-analog');
  const [tapeWarmth, setTapeWarmthState] = useState<boolean>(true);
  const [spatial3d, setSpatial3dState] = useState<boolean>(true);

  useEffect(() => {
    const unsub = audioEngine.onStateChange(() => {
      setAudioStatus(audioEngine.getAudioStatus());
    });
    return () => { unsub(); };
  }, []);

  const setEqPreset = useCallback((preset: EqPreset) => {
    setEqPresetState(preset);
    audioEngine.applyEqPreset(preset);
  }, []);

  const toggleTapeWarmth = useCallback(() => {
    setTapeWarmthState(prev => {
      const nextVal = !prev;
      audioEngine.setTapeWarmth(nextVal);
      return nextVal;
    });
  }, []);

  const toggleSpatial3d = useCallback(() => {
    setSpatial3dState(prev => {
      const nextVal = !prev;
      audioEngine.setSpatial3d(nextVal);
      return nextVal;
    });
  }, []);

  const toggleDirectOutput = useCallback(() => {
    const current = audioStatus.directOutput;
    audioEngine.setDirectOutput(!current);
    setAudioStatus(audioEngine.getAudioStatus());
  }, [audioStatus]);

  const toggleOutputMode = useCallback(() => {
    const nextMode = audioStatus.outputMode === 'WASAPI Exclusive' ? 'WASAPI Shared' : 'WASAPI Exclusive';
    audioEngine.setOutputMode(nextMode);
    setAudioStatus(audioEngine.getAudioStatus());
  }, [audioStatus]);

  const toggleReplayGain = useCallback(() => {
    const modes = ['OFF', 'TRACK', 'ALBUM'];
    const currentIdx = modes.indexOf(audioStatus.replayGain || 'OFF');
    const nextMode = modes[(currentIdx + 1) % modes.length];
    audioEngine.setReplayGain(nextMode);
    setAudioStatus(audioEngine.getAudioStatus());
  }, [audioStatus]);

  // Navigation & UI settings
  const [viewState, setViewState] = useState<ViewState>('appliance');
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gridMode, setGridMode] = useState<'grid' | 'list'>('grid');
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<PlayerSettings>({
    displayMode: 'standard',
    einkSubMode: '4gray',
    artMode: 'on',
    densityLevel: 'comfortable',
    repeatMode: 'off',
    shuffle: false,
    volume: 72,
    isMuted: false,
    autoplay: true,
    crossfade: 2
  });

  const STORAGE_KEYS = {
    FOLDERS: 'DRAUN_PERSISTED_FOLDERS',
    IMPORTED_TRACKS: 'DRAUN_PERSISTED_TRACKS',
    CURRENT_TRACK_ID: 'DRAUN_CURRENT_TRACK_ID',
    HISTORY: 'DRAUN_PLAY_HISTORY'
  };

  const formatAudioUrl = (filePath: string) => {
    if (!filePath) return '';
    let clean = filePath.replace(/\\/g, '/');
    if (!clean.startsWith('/')) clean = '/' + clean;
    return `file://${clean}`;
  };

  // Helper to import auto-scanned audio file paths from OS Music Directory
  const importScannedFilePaths = useCallback(async (scannedFiles: Array<{ name: string; fullPath: string; folderName: string }>) => {
    if (!scannedFiles || scannedFiles.length === 0) return;

    const normPath = (p: string) => p.replace(/\\/g, '/').toLowerCase();

    setTracks(prev => {
      const existingPaths = new Set(prev.map(t => normPath(t.filePath || '')));
      const existingNames = new Set(prev.map(t => normPath(t.filePath || '').split('/').pop() || ''));
      // Filter out files already in library by path OR by filename (catches path-separator mismatches)
      const newFiles = scannedFiles.filter(sf =>
        !existingPaths.has(normPath(sf.fullPath)) &&
        !existingNames.has(normPath(sf.fullPath).split('/').pop() || '')
      );
      if (newFiles.length === 0) return prev;

      const newTracks: Track[] = [];
      const folderMap = new Map<string, Track[]>();

      newFiles.forEach((file, idx) => {
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const audioUrl = formatAudioUrl(file.fullPath);

        const trk: Track = {
          id: `scanned-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          title: fileNameWithoutExt,
          artist: 'Local Artist',
          artistId: 'art-local',
          album: file.folderName,
          albumId: `alb-${file.folderName}`,
          folderName: file.folderName,
          duration: 180,
          year: new Date().getFullYear(),
          genre: 'Local Music',
          favorite: false,
          audioUrl: audioUrl,
          filePath: file.fullPath,
          cover: '/album-covers/placeholder.jpg',
          trackNumber: idx + 1
        };

        // Auto-recognize artist, album name, year, genre, and cover art
        autoRecognizeSongMetadata({
          fileName: file.name,
          folderName: file.folderName
        }).then(rec => {
          trk.title = rec.title;
          trk.artist = rec.artist;
          trk.album = rec.album;
          trk.year = rec.year;
          trk.genre = rec.genre;
          if (rec.coverUrl) trk.cover = rec.coverUrl;

          setTracks(tList => tList.map(t => t.id === trk.id ? { ...t, ...rec, cover: rec.coverUrl || t.cover } : t));
          setQueueState(qList => qList.map(t => t.id === trk.id ? { ...t, ...rec, cover: rec.coverUrl || t.cover } : t));

          setAlbums(albList => {
            const updated = [...albList];
            // Match ONLY by albumId or folderName — never by rec.album to avoid merging different albums
            const albIdx = updated.findIndex(a => a.id === trk.albumId || a.title === file.folderName);
            if (albIdx >= 0) {
              updated[albIdx] = {
                ...updated[albIdx],
                // Keep folder name as title — don't rename with iTunes result
                artist: rec.artist !== 'Unknown Artist' ? rec.artist : updated[albIdx].artist,
                year: rec.year || updated[albIdx].year,
                genre: rec.genre || updated[albIdx].genre,
                cover: rec.coverUrl || updated[albIdx].cover
              };
            }
            return updated;
          });
        });

        newTracks.push(trk);

        if (!folderMap.has(file.folderName)) {
          folderMap.set(file.folderName, []);
        }
        folderMap.get(file.folderName)!.push(trk);
      });

      setQueueState(qPrev => [...newTracks, ...qPrev]);

      setAlbums(aPrev => {
        const updatedAlbums = [...aPrev];
        folderMap.forEach((trks, fName) => {
          const albId = `alb-${fName}`;
          const existingIdx = updatedAlbums.findIndex(a => a.id === albId || a.title === fName);
          if (existingIdx >= 0) {
            updatedAlbums[existingIdx] = {
              ...updatedAlbums[existingIdx],
              tracks: [...trks, ...updatedAlbums[existingIdx].tracks]
            };
          } else {
            updatedAlbums.push({
              id: albId,
              title: fName,
              artist: trks[0]?.artist || 'Local Artist',
              artistId: 'art-local',
              year: new Date().getFullYear(),
              genre: 'Local Music',
              tracks: trks,
              cover: trks[0]?.cover
            });
          }
        });
        return updatedAlbums;
      });

      setFolders(fPrev => {
        const updatedFolders = [...fPrev];
        folderMap.forEach((trks, fName) => {
          const existingIdx = updatedFolders.findIndex(f => f.folderName === fName);
          if (existingIdx >= 0) {
            updatedFolders[existingIdx] = {
              ...updatedFolders[existingIdx],
              tracks: [...trks, ...updatedFolders[existingIdx].tracks]
            };
          } else {
            updatedFolders.push({
              id: `fold-${fName}`,
              folderName: fName,
              tracks: trks
            });
          }
        });
        return updatedFolders;
      });

      return [...newTracks, ...prev];
    });
  }, []);

  // Restore imported library & track history upon application startup (Disk JSON + LocalStorage)
  useEffect(() => {
    const hydrateTrack = (t: Track): Track => {
      if (t.filePath) {
        return { ...t, audioUrl: formatAudioUrl(t.filePath) };
      }
      return t;
    };

    const loadLibraryData = async () => {
      let loadedTracks: Track[] = [];
      let loadedFolders: FolderPlaylist[] = [];
      let loadedAlbums: Album[] = [];
      let loadedHistory: Track[] = [];
      let loadedCurrentId: string | null = null;

      // 1. Load from Electron persistent disk JSON store
      const win = window as any;
      if (win.libraryAPI && win.libraryAPI.loadLibrary) {
        try {
          const storeData = await win.libraryAPI.loadLibrary();
          if (storeData) {
            if (storeData.tracks && storeData.tracks.length > 0) loadedTracks = storeData.tracks;
            if (storeData.folders && storeData.folders.length > 0) loadedFolders = storeData.folders;
            if (storeData.albums && storeData.albums.length > 0) loadedAlbums = storeData.albums;
            if (storeData.history && storeData.history.length > 0) loadedHistory = storeData.history;
            if (storeData.lastTrackId) loadedCurrentId = storeData.lastTrackId;
            if (storeData.eqPreset) setEqPresetState(storeData.eqPreset);
            if (typeof storeData.tapeWarmth === 'boolean') setTapeWarmthState(storeData.tapeWarmth);
            if (typeof storeData.spatial3d === 'boolean') setSpatial3dState(storeData.spatial3d);
          }
        } catch (e) {}
      }

      // 2. LocalStorage fallback/merge
      try {
        const storedFolders = localStorage.getItem(STORAGE_KEYS.FOLDERS);
        const storedTracks = localStorage.getItem(STORAGE_KEYS.IMPORTED_TRACKS);
        const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
        const storedCurrentId = localStorage.getItem(STORAGE_KEYS.CURRENT_TRACK_ID);

        if (loadedFolders.length === 0 && storedFolders) loadedFolders = JSON.parse(storedFolders);
        if (loadedTracks.length === 0 && storedTracks) loadedTracks = JSON.parse(storedTracks);
        if (loadedHistory.length === 0 && storedHistory) loadedHistory = JSON.parse(storedHistory);
        if (!loadedCurrentId && storedCurrentId) loadedCurrentId = storedCurrentId;
      } catch (err) {}

      if (loadedFolders.length > 0) {
        setFolders(loadedFolders.map(f => ({ ...f, tracks: f.tracks.map(hydrateTrack) })));
      }

      if (loadedTracks.length > 0) {
        const hydratedTracks = loadedTracks.map(hydrateTrack);
        setTracks(hydratedTracks);
        setQueueState(hydratedTracks);

        if (loadedAlbums.length > 0) {
          setAlbums(loadedAlbums);
        } else {
          const folderMap = new Map<string, Track[]>();
          hydratedTracks.forEach(t => {
            const fName = t.folderName || t.album || 'Imported';
            if (!folderMap.has(fName)) folderMap.set(fName, []);
            folderMap.get(fName)!.push(t);
          });
          const autoAlbums: Album[] = [];
          folderMap.forEach((trks, fName) => {
            autoAlbums.push({
              id: `alb-${fName}`,
              title: fName,
              artist: trks[0]?.artist || 'Local Artist',
              artistId: 'art-local',
              year: new Date().getFullYear(),
              genre: 'Local Music',
              tracks: trks,
              cover: trks[0]?.cover
            });
          });
          setAlbums(autoAlbums);
        }
      }

      if (loadedHistory.length > 0) setHistory(loadedHistory.map(hydrateTrack));

      if (loadedCurrentId) {
        const match = loadedTracks.find(t => t.id === loadedCurrentId);
        if (match) setCurrentTrack(hydrateTrack(match));
      }
    };

    loadLibraryData();

    // Listen for automatic OS Music folder scan on launch
    let unsub: (() => void) | undefined;
    const win = window as any;
    if (win.libraryAPI && win.libraryAPI.onAutoScannedMusic) {
      unsub = win.libraryAPI.onAutoScannedMusic((files: any[]) => {
        importScannedFilePaths(files);
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [importScannedFilePaths]);

  // Persist library history & added songs automatically upon changes
  useEffect(() => {
    try {
      const persistableTracks = tracks.filter(t => !t.id.startsWith('mock-'));
      if (folders.length > 0) {
        localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
      }
      if (persistableTracks.length > 0) {
        localStorage.setItem(STORAGE_KEYS.IMPORTED_TRACKS, JSON.stringify(persistableTracks));
      }
      if (history.length > 0) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 100)));
      }
      if (currentTrack) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK_ID, currentTrack.id);
      }

      // Save to Electron persistent disk JSON store
      const win = window as any;
      if (win.libraryAPI && win.libraryAPI.saveLibrary) {
        win.libraryAPI.saveLibrary({
          tracks: persistableTracks,
          albums: albums,
          folders: folders,
          history: history.slice(0, 100),
          lastTrackId: currentTrack?.id || null,
          settings: settings,
          eqPreset: eqPreset,
          tapeWarmth: tapeWarmth,
          spatial3d: spatial3d
        });
      }
    } catch (err) {
      console.warn('Could not persist library data to storage:', err);
    }
  }, [tracks, folders, history, currentTrack, albums, settings, eqPreset, tapeWarmth, spatial3d]);

  // Fetch online lyrics automatically for currently playing track from online sources (LRCLIB / Lyrics.ovh)
  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrack.lyrics && currentTrack.lyrics.trim().length > 0) return;

    const trackId = currentTrack.id;
    fetchOnlineLyrics(currentTrack.title, currentTrack.artist, currentTrack.album).then(onlineLyrics => {
      if (onlineLyrics) {
        setCurrentTrack(prev => (prev && prev.id === trackId ? { ...prev, lyrics: onlineLyrics } : prev));
        setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, lyrics: onlineLyrics } : t)));
      }
    });
  }, [currentTrack?.id]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    setDuration(track.duration && track.duration > 0 ? track.duration : 0);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.loadTrack(track);
    audioEngine.play();

    // Record track in play history
    setHistory(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 100);
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (newQueue) {
      setQueueState(newQueue);
      const idx = newQueue.findIndex(t => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) nextIdx = 0;
    setQueueIndex(nextIdx);
    playTrack(queue[nextIdx]);
  }, [queue, queueIndex, playTrack]);

  const previousTrack = useCallback(() => {
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    setQueueIndex(prevIdx);
    playTrack(queue[prevIdx]);
  }, [queue, queueIndex, playTrack]);

  // Audio Engine Event Listeners
  useEffect(() => {
    const unsubTime = audioEngine.onTimeUpdate((cTime, dur) => {
      setCurrentTime(cTime);
      if (dur && !isNaN(dur) && dur > 0) {
        setDuration(dur);
      }
    });

    const unsubState = audioEngine.onStateChange((playing) => {
      setIsPlaying(playing);
    });

    const unsubEnded = audioEngine.onTrackEnded(() => {
      nextTrack();
    });

    return () => {
      unsubTime();
      unsubState();
      unsubEnded();
    };
  }, [nextTrack]);

  // Multi-Tiered Album Art Resolver
  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrack.cover && currentTrack.cover !== '/album-covers/placeholder.jpg') return;

    let isMounted = true;
    resolveAlbumArt({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      folderName: currentTrack.folderName
    }).then(artUrl => {
      if (isMounted && artUrl) {
        setCurrentTrack(prev => prev && prev.id === currentTrack.id ? { ...prev, cover: artUrl } : prev);
        setTracks(prev => prev.map(t => t.id === currentTrack.id ? { ...t, cover: artUrl } : t));
        setQueueState(prev => prev.map(t => t.id === currentTrack.id ? { ...t, cover: artUrl } : t));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id]);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack && queue.length > 0) {
      playTrack(queue[0]);
      return;
    }
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
  }, [isPlaying, currentTrack, queue, playTrack]);

  const seekTo = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const cleanVol = Math.max(0, Math.min(100, Math.round(vol)));
    setVolumeState(cleanVol);
    audioEngine.setVolume(cleanVol / 100);
    setSettings(prev => ({ ...prev, volume: cleanVol }));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const nextMute = !prev;
      audioEngine.setMute(nextMute);
      setSettings(s => ({ ...s, isMuted: nextMute }));
      return nextMute;
    });
  }, []);

  const toggleFavorite = useCallback((trackId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(trackId);
      const nextFavs = isFav ? prev.filter(id => id !== trackId) : [...prev, trackId];
      setTracks(tList => tList.map(t => t.id === trackId ? { ...t, favorite: !isFav } : t));
      return nextFavs;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const nextVal = !prev;
      setSettings(s => ({ ...s, shuffle: nextVal }));
      return nextVal;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const nextIdx = (modes.indexOf(prev) + 1) % modes.length;
      const nextVal = modes[nextIdx];
      setSettings(s => ({ ...s, repeatMode: nextVal }));
      return nextVal;
    });
  }, []);

  const setQueue = useCallback((newQueue: Track[]) => {
    setQueueState(newQueue);
    setQueueIndex(0);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueueState(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueueState(prev => prev.filter((_, i) => i !== index));
  }, []);

  const reorderQueue = useCallback((newQueue: Track[]) => {
    setQueueState(newQueue);
  }, []);

  const clearQueue = useCallback(() => {
    setQueueState([]);
    setQueueIndex(0);
  }, []);

  const openAlbumDetail = useCallback((album: Album) => {
    setActiveAlbum(album);
    setViewState('album-detail');
  }, []);

  const openArtistDetail = useCallback((artist: Artist) => {
    setActiveArtist(artist);
    setViewState('artist-detail');
  }, []);

  const openPlaylistDetail = useCallback((playlist: Playlist) => {
    setActivePlaylist(playlist);
    setViewState('playlist-detail');
  }, []);

  const openGenreDetail = useCallback((genre: string) => {
    setActiveGenre(genre);
    setViewState('genre-detail');
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setSettings(prev => ({ ...prev, displayMode: mode }));
  }, []);

  const setEinkSubMode = useCallback((subMode: EinkSubMode) => {
    setSettings(prev => ({ ...prev, einkSubMode: subMode }));
  }, []);

  const setArtMode = useCallback((mode: AlbumArtMode) => {
    setSettings(prev => ({ ...prev, artMode: mode }));
  }, []);

  const setDensityLevel = useCallback((level: DensityLevel) => {
    setSettings(prev => ({ ...prev, densityLevel: level }));
  }, []);

  const setCrossfade = useCallback((seconds: number) => {
    const cleanSec = Math.max(0, Math.min(12, seconds));
    setSettings(prev => ({ ...prev, crossfade: cleanSec }));
    audioEngine.setCrossfadeDuration(cleanSec);
  }, []);

  const toggleArtMode = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      artMode: prev.artMode === 'on' ? 'off' : 'on'
    }));
  }, []);

  // Import local files & folders
  const importLocalFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const audioFiles = files.filter(f =>
      f.type.startsWith('audio/') ||
      /\.(mp3|flac|wav|m4a|aac|ogg|opus)$/i.test(f.name)
    );

    if (audioFiles.length === 0) return;

    // Deduplicate against already-imported tracks by native path or filename
    const normPath = (p: string) => p.replace(/\\/g, '/').toLowerCase();
    const existingPaths = new Set(tracks.map(t => normPath(t.filePath || '')).filter(Boolean));
    const existingNames = new Set(tracks.map(t => normPath(t.filePath || '').split('/').pop() || '').filter(Boolean));
    const deduped = audioFiles.filter(f => {
      const nativePath = normPath((f as any).path || '');
      const fname = f.name.toLowerCase();
      return !existingPaths.has(nativePath) && !existingNames.has(fname);
    });
    if (deduped.length === 0) return;

    const newTracks: Track[] = [];
    const folderMap = new Map<string, Track[]>();

    deduped.forEach((file, idx) => {
      const relPath = (file as any).webkitRelativePath || file.name;
      const pathParts = relPath.split('/');
      const folderName = pathParts.length > 1 ? pathParts[0] : 'IMPORTED MUSIC';
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const nativePath = (file as any).path || '';

      const blobUrl = URL.createObjectURL(file);
      const fileUrl = nativePath ? formatAudioUrl(nativePath) : blobUrl;
      const audioUrl = blobUrl || fileUrl;

      const trk: Track = {
        id: `local-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        title: fileNameWithoutExt,
        artist: 'Local Artist',
        artistId: 'art-local',
        album: folderName,
        albumId: `alb-${folderName}`,
        folderName: folderName,
        duration: 0,
        year: new Date().getFullYear(),
        genre: 'Imported',
        favorite: false,
        audioUrl: audioUrl,
        filePath: nativePath,
        cover: '/album-covers/placeholder.jpg',
        trackNumber: idx + 1
      };

      // Asynchronously extract exact track duration from audio metadata
      const tempAudio = new Audio(audioUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
          const exactDuration = Math.round(tempAudio.duration);
          trk.duration = exactDuration;
          setTracks(prev => prev.map(t => t.id === trk.id ? { ...t, duration: exactDuration } : t));
          setQueueState(prev => prev.map(t => t.id === trk.id ? { ...t, duration: exactDuration } : t));
          setFolders(prev => prev.map(f => ({
            ...f,
            tracks: f.tracks.map(t => t.id === trk.id ? { ...t, duration: exactDuration } : t)
          })));
        }
      });

      // Auto-recognize artist, album name, year, genre, and cover art through song metadata & online APIs
      autoRecognizeSongMetadata({
        fileName: file.name,
        folderName: folderName,
        file: file
      }).then(rec => {
        trk.title = rec.title;
        trk.artist = rec.artist;
        trk.album = rec.album;
        trk.year = rec.year;
        trk.genre = rec.genre;
        if (rec.coverUrl) trk.cover = rec.coverUrl;

        setTracks(prev => prev.map(t => t.id === trk.id ? {
          ...t,
          title: rec.title,
          artist: rec.artist,
          album: rec.album,
          year: rec.year,
          genre: rec.genre,
          cover: rec.coverUrl || t.cover
        } : t));

        setQueueState(prev => prev.map(t => t.id === trk.id ? {
          ...t,
          title: rec.title,
          artist: rec.artist,
          album: rec.album,
          year: rec.year,
          genre: rec.genre,
          cover: rec.coverUrl || t.cover
        } : t));

        setAlbums(prev => {
          const updated = [...prev];
          // Match ONLY by albumId or folderName — never by rec.album to avoid merging different albums
          const albIdx = updated.findIndex(a => a.id === trk.albumId || a.title === folderName);
          if (albIdx >= 0) {
            updated[albIdx] = {
              ...updated[albIdx],
              // Keep folder name as title — don't rename with iTunes result
              artist: rec.artist !== 'Unknown Artist' ? rec.artist : updated[albIdx].artist,
              year: rec.year || updated[albIdx].year,
              genre: rec.genre || updated[albIdx].genre,
              cover: rec.coverUrl || updated[albIdx].cover
            };
          }
          return updated;
        });

        setFolders(prev => prev.map(f => f.folderName === folderName ? {
          ...f,
          tracks: f.tracks.map(t => t.id === trk.id ? {
            ...t,
            title: rec.title,
            artist: rec.artist,
            album: rec.album,
            year: rec.year,
            genre: rec.genre,
            cover: rec.coverUrl || t.cover
          } : t)
        } : f));
      });

      newTracks.push(trk);

      if (!folderMap.has(folderName)) {
        folderMap.set(folderName, []);
      }
      folderMap.get(folderName)!.push(trk);
    });

    if (newTracks.length > 0) {
      setTracks(prev => [...newTracks, ...prev]);
      setQueueState(prev => [...newTracks, ...prev]);

      setAlbums(prev => {
        const updatedAlbums = [...prev];
        folderMap.forEach((trks, fName) => {
          const albId = `alb-${fName}`;
          const existingIdx = updatedAlbums.findIndex(a => a.id === albId || a.title === fName);
          if (existingIdx >= 0) {
            updatedAlbums[existingIdx] = {
              ...updatedAlbums[existingIdx],
              tracks: [...trks, ...updatedAlbums[existingIdx].tracks]
            };
          } else {
            updatedAlbums.push({
              id: albId,
              title: fName,
              artist: trks[0]?.artist || 'Imported Artist',
              artistId: 'art-local',
              year: new Date().getFullYear(),
              genre: 'Imported',
              cover: trks[0]?.cover || undefined,
              tracks: trks
            });
          }
        });
        return updatedAlbums;
      });

      setFolders(prev => {
        const updated = [...prev];
        folderMap.forEach((trks, fName) => {
          const existingIdx = updated.findIndex(f => f.folderName === fName);
          if (existingIdx >= 0) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              tracks: [...trks, ...updated[existingIdx].tracks]
            };
          } else {
            updated.push({
              id: `fld-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              folderName: fName,
              tracks: trks
            });
          }
        });
        // Persist updated folders immediately
        try {
          localStorage.setItem('DRAUN_PERSISTED_FOLDERS', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      playTrack(newTracks[0]);
    }
  }, [playTrack]);

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      shuffle,
      repeatMode,
      queue,
      queueIndex,
      history,
      eqPreset,
      tapeWarmth,
      spatial3d,
      audioStatus,
      setEqPreset,
      toggleTapeWarmth,
      toggleSpatial3d,
      toggleDirectOutput,
      toggleOutputMode,
      toggleReplayGain,
      tracks,
      albums,
      artists,
      playlists,
      folders,
      favorites,
      viewState,
      activeAlbum,
      activeArtist,
      activePlaylist,
      activeGenre,
      searchQuery,
      gridMode,
      settings,
      isQueueOpen,
      playTrack,
      togglePlayPause,
      nextTrack,
      previousTrack,
      seekTo,
      setVolume,
      toggleMute,
      toggleFavorite,
      toggleShuffle,
      toggleRepeat,
      setQueue,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      clearQueue,
      setViewState,
      openAlbumDetail,
      openArtistDetail,
      openPlaylistDetail,
      openGenreDetail,
      setSearchQuery,
      setGridMode,
      setDisplayMode,
      setEinkSubMode,
      setArtMode,
      setDensityLevel,
      setCrossfade,
      setIsQueueOpen,
      toggleArtMode,
      createPlaylist: () => {},
      addTrackToPlaylist: () => {},
      removeTrackFromPlaylist: () => {},
      importLocalFiles
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
