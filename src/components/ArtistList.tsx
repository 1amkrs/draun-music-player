import React from 'react';
import { Artist } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { TrackTable } from './TrackRow';
import { AlbumGrid } from './AlbumCard';
import { ArrowLeft, Disc, Music } from 'lucide-react';

export const ArtistList: React.FC = () => {
  const { artists, openArtistDetail } = usePlayer();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
        ARTIST DIRECTORY CATALOG ({artists.length} ARTISTS)
      </div>

      <div style={{ border: 'var(--border-width) solid var(--border)', backgroundColor: 'var(--bg)' }}>
        {/* Header */}
        <div
          className="sticky-header"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 200px 100px',
            padding: '8px 16px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            letterSpacing: '0.06em'
          }}
        >
          <div>ARTIST NAME</div>
          <div>DISCOGRAPHY</div>
          <div style={{ textAlign: 'right' }}>CATALOG CODE</div>
        </div>

        {artists.map((artist, idx) => (
          <div
            key={artist.id}
            onClick={() => openArtistDetail(artist)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 200px 100px',
              alignItems: 'center',
              padding: 'var(--density-padding)',
              minHeight: 'var(--density-row-height)',
              borderBottom: 'var(--border-width) solid var(--border)',
              cursor: 'pointer'
            }}
            className="btn-hardware-hover"
          >
            <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {artist.name}
            </div>
            <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {artist.albumsCount} ALBUMS · {artist.tracksCount} TRACKS
            </div>
            <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
              REF-{idx + 101}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ArtistDetail: React.FC = () => {
  const { activeArtist, setViewState, albums, tracks } = usePlayer();

  if (!activeArtist) {
    return (
      <div style={{ padding: '32px' }}>
        <button onClick={() => setViewState('artists')} className="btn-hardware">
          <ArrowLeft size={14} style={{ marginRight: '6px' }} />
          BACK TO ARTISTS
        </button>
      </div>
    );
  }

  const artistAlbums = albums.filter(a => a.artistId === activeArtist.id || a.artist.toLowerCase() === activeArtist.name.toLowerCase());
  const artistTracks = tracks.filter(t => t.artistId === activeArtist.id || t.artist.toLowerCase() === activeArtist.name.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <button onClick={() => setViewState('artists')} className="btn-hardware" style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}>
          <ArrowLeft size={14} />
          <span>ARTIST DIRECTORY</span>
        </button>
      </div>

      {/* Artist Profile Banner */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
            [ARTIST PROFILE]
          </span>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            DISCOGRAPHY CATALOG
          </span>
        </div>

        <h2 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          {activeArtist.name}
        </h2>

        {activeArtist.bio && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '700px', lineHeight: 1.5 }}>
            {activeArtist.bio}
          </p>
        )}

        <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          <div><Disc size={14} style={{ display: 'inline', marginRight: '4px' }} /> {artistAlbums.length} ALBUMS IN LIBRARY</div>
          <div><Music size={14} style={{ display: 'inline', marginRight: '4px' }} /> {artistTracks.length} TRACKS IN LIBRARY</div>
        </div>
      </div>

      {/* Albums Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.04em' }}>ALBUMS</h3>
        <AlbumGrid albums={artistAlbums} />
      </div>

      {/* Top Tracks Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.04em' }}>TOP TRACKS</h3>
        <TrackTable tracks={artistTracks} showArtist={false} />
      </div>
    </div>
  );
};
