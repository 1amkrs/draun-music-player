import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { AlbumGrid } from './AlbumCard';
import { TrackTable } from './TrackRow';
import { Disc, Play, Heart, ListMusic, History } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { albums, tracks, favorites, playlists, history, setViewState, playTrack } = usePlayer();

  const recentlyPlayedTracks = history.length > 0 ? history.slice(0, 5) : tracks.slice(0, 5);
  const recentlyAddedAlbums = albums.slice(0, 6);
  const favoriteTracks = tracks.filter(t => favorites.includes(t.id)).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Overview Status Banner */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div className="font-mono" style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em' }}>
            SYSTEM READOUT // DRAUN AP-26 AUDIO APPLIANCE
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', marginTop: '2px' }}>
            LOCAL MUSIC LIBRARY OVERVIEW
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <div>TOTAL CATALOG: <strong style={{ color: 'var(--text)' }}>{tracks.length} TRACKS</strong></div>
          <div>ALBUMS: <strong style={{ color: 'var(--text)' }}>{albums.length}</strong></div>
          <div>STARRED: <strong style={{ color: 'var(--text)' }}>{favorites.length}</strong></div>
        </div>
      </div>

      {/* SECTION 1: RECENTLY PLAYED */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              RECENTLY PLAYED
            </h3>
          </div>
          <button onClick={() => setViewState('recently-played')} className="btn-hardware" style={{ padding: '4px 8px', fontSize: '10px' }}>
            VIEW ALL HISTORY &rarr;
          </button>
        </div>
        <TrackTable tracks={recentlyPlayedTracks} />
      </div>

      {/* SECTION 2: RECENTLY ADDED ALBUMS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Disc size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              RECENTLY ADDED ALBUMS
            </h3>
          </div>
          <button onClick={() => setViewState('albums')} className="btn-hardware" style={{ padding: '4px 8px', fontSize: '10px' }}>
            VIEW ALL ALBUMS &rarr;
          </button>
        </div>
        <AlbumGrid albums={recentlyAddedAlbums} />
      </div>

      {/* SECTION 3: FAVORITE TRACKS */}
      {favoriteTracks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={16} color="var(--accent)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                STARRED FAVORITES
              </h3>
            </div>
            <button onClick={() => setViewState('favorites')} className="btn-hardware" style={{ padding: '4px 8px', fontSize: '10px' }}>
              VIEW ALL FAVORITES &rarr;
            </button>
          </div>
          <TrackTable tracks={favoriteTracks} />
        </div>
      )}
    </div>
  );
};
