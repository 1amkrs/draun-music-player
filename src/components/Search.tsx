import React, { useRef, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { TrackTable } from './TrackRow';
import { AlbumGrid } from './AlbumCard';
import { ArtistList } from './ArtistList';
import { Search as SearchIcon, X } from 'lucide-react';

export const Search: React.FC = () => {
  const { searchQuery, setSearchQuery, tracks, albums, artists, playlists } = usePlayer();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const query = searchQuery.trim().toLowerCase();

  const matchedTracks = query
    ? tracks.filter(t => t.title.toLowerCase().includes(query) || t.artist.toLowerCase().includes(query) || t.album.toLowerCase().includes(query))
    : [];

  const matchedAlbums = query
    ? albums.filter(a => a.title.toLowerCase().includes(query) || a.artist.toLowerCase().includes(query))
    : [];

  const matchedArtists = query
    ? artists.filter(a => a.name.toLowerCase().includes(query))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Large Simple Search Input */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <SearchIcon size={24} color="var(--accent)" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Type to search tracks, artists, albums, playlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '20px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            color: 'var(--text)'
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="btn-icon" style={{ border: 'none' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {!query ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          [ ENTER SEARCH QUERY ABOVE TO QUERY LOCAL LIBRARY DATABASE ]
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* TRACKS RESULTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
              MATCHED TRACKS ({matchedTracks.length})
            </div>
            <TrackTable tracks={matchedTracks} />
          </div>

          {/* ALBUMS RESULTS */}
          {matchedAlbums.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
                MATCHED ALBUMS ({matchedAlbums.length})
              </div>
              <AlbumGrid albums={matchedAlbums} />
            </div>
          )}

          {/* ARTISTS RESULTS */}
          {matchedArtists.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
                MATCHED ARTISTS ({matchedArtists.length})
              </div>
              <div style={{ border: 'var(--border-width) solid var(--border)', backgroundColor: 'var(--bg)' }}>
                {matchedArtists.map(art => (
                  <div
                    key={art.id}
                    style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '16px' }}
                  >
                    {art.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
