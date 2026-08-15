export type DisplayMode = 'eink' | 'standard' | 'dark' | 'high-contrast';
export type EinkSubMode = '1bit' | '4gray' | 'grayscale';
export type AlbumArtMode = 'on' | 'off';
export type DensityLevel = 'comfortable' | 'compact' | 'eink';
export type RepeatMode = 'off' | 'all' | 'one';
export type EqPreset = 'flat' | 'warm-analog' | 'bass-boost' | 'vocal-clarity' | 'eink-pure';

export type ViewState = 
  | 'home' 
  | 'albums' 
  | 'album-detail' 
  | 'artists' 
  | 'artist-detail' 
  | 'songs' 
  | 'genres' 
  | 'genre-detail' 
  | 'playlists' 
  | 'playlist-detail' 
  | 'favorites' 
  | 'recently-played' 
  | 'search' 
  | 'now-playing' 
  | 'appliance'
  | 'settings';

export interface SynthParams {
  synthType: 'lofi' | 'ambient' | 'electro' | 'classical' | 'chiptune' | 'drone' | 'jazz';
  bpm: number;
  rootFreq: number; // Hz, e.g. 220 (A3)
  scale: number[];  // semitone offsets, e.g. [0, 2, 4, 7, 9]
  pattern: number[]; // index in scale for sequence
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artist: string;
  albumId: string;
  album: string;
  folderName?: string;
  duration: number; // seconds
  year: number;
  genre: string;
  trackNumber: number;
  cover?: string;
  favorite: boolean;
  audioUrl?: string; // HTML5 Audio URL if imported or local file
  filePath?: string; // Native file system path for persistent reloading upon app restart
  synthParams?: SynthParams; // Web Audio API synth procedural generator
  lyrics?: string;
}

export interface FolderPlaylist {
  id: string;
  folderName: string;
  tracks: Track[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  year: number;
  genre: string;
  cover?: string;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  albumsCount: number;
  tracksCount: number;
  cover?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: string;
}

export interface PlayerSettings {
  displayMode: DisplayMode;
  einkSubMode: EinkSubMode;
  artMode: AlbumArtMode;
  densityLevel: DensityLevel;
  repeatMode: RepeatMode;
  shuffle: boolean;
  volume: number; // 0 - 100
  isMuted: boolean;
  autoplay: boolean;
  crossfade: number; // seconds
}
