import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { AlbumArt } from './AlbumArt';
import { TrackTable } from './TrackRow';
import { Play, Shuffle, ArrowLeft } from 'lucide-react';
import { formatTime } from './ProgressBar';

export const AlbumDetail: React.FC = () => {
  const { activeAlbum, setViewState, playTrack, setQueue, settings } = usePlayer();

  if (!activeAlbum) {
    return (
      <div style={{ padding: '32px' }}>
        <button onClick={() => setViewState('albums')} className="btn-hardware">
          <ArrowLeft size={14} style={{ marginRight: '6px' }} />
          BACK TO ALBUMS
        </button>
      </div>
    );
  }

  const isArtOn = settings.artMode === 'on';
  const totalDuration = activeAlbum.tracks.reduce((acc, t) => acc + t.duration, 0);

  const handlePlayAll = () => {
    if (activeAlbum.tracks.length > 0) {
      playTrack(activeAlbum.tracks[0], activeAlbum.tracks);
    }
  };

  const handleShuffleAll = () => {
    if (activeAlbum.tracks.length > 0) {
      const shuffled = [...activeAlbum.tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation Breadcrumb */}
      <div>
        <button onClick={() => setViewState('albums')} className="btn-hardware" style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}>
          <ArrowLeft size={14} />
          <span>ALBUM CATALOG</span>
        </button>
      </div>

      {/* Album Header Block */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '24px',
          display: 'flex',
          gap: '24px',
          alignItems: isArtOn ? 'flex-start' : 'center',
          flexWrap: 'wrap'
        }}
      >
        {isArtOn && (
          <AlbumArt src={activeAlbum.cover} alt={activeAlbum.title} size={180} />
        )}

        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
              [ALBUM ARCHIVE]
            </span>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              RELEASE YEAR: {activeAlbum.year}
            </span>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1.1 }}>
            {activeAlbum.title}
          </h2>

          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {activeAlbum.artist}
          </div>

          {/* Technical Metadata Row */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              padding: '8px 12px',
              border: 'var(--border-width) solid var(--border)',
              backgroundColor: 'var(--bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginTop: '4px'
            }}
          >
            <div>GENRE: <strong style={{ color: 'var(--text)' }}>{activeAlbum.genre.toUpperCase()}</strong></div>
            <div>TRACKS: <strong style={{ color: 'var(--text)' }}>{activeAlbum.tracks.length}</strong></div>
            <div>DURATION: <strong style={{ color: 'var(--text)' }}>{formatTime(totalDuration)}</strong></div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={handlePlayAll} className="btn-hardware active" style={{ gap: '8px', padding: '10px 20px' }}>
              <Play size={16} />
              <span>PLAY ALBUM</span>
            </button>
            <button onClick={handleShuffleAll} className="btn-hardware" style={{ gap: '8px', padding: '10px 16px' }}>
              <Shuffle size={16} />
              <span>SHUFFLE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <TrackTable tracks={activeAlbum.tracks} showAlbum={false} showArtist={false} />
    </div>
  );
};
