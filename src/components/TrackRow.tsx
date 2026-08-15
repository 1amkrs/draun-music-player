import React from 'react';
import { Track } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from './ProgressBar';
import { Play, Pause, Heart, Plus, MoreHorizontal } from 'lucide-react';

interface TrackRowProps {
  track: Track;
  index: number;
  showAlbum?: boolean;
  showArtist?: boolean;
  playlistContextId?: string;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  showAlbum = true,
  showArtist = true,
  playlistContextId
}) => {
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    toggleFavorite, 
    favorites, 
    addToQueue,
    playlists,
    addTrackToPlaylist
  } = usePlayer();

  const isCurrent = currentTrack?.id === track.id;
  const isFav = favorites.includes(track.id);

  return (
    <div
      onClick={() => playTrack(track)}
      style={{
        display: 'grid',
        gridTemplateColumns: showAlbum 
          ? '40px 1fr 180px 180px 70px 70px' 
          : '40px 1fr 180px 70px 70px',
        alignItems: 'center',
        padding: 'var(--density-padding)',
        minHeight: 'var(--density-row-height)',
        borderBottom: 'var(--border-width) solid var(--border)',
        backgroundColor: isCurrent ? 'var(--surface-2)' : 'transparent',
        cursor: 'pointer',
        userSelect: 'none',
        gap: '8px'
      }}
      className="track-row-hover"
    >
      {/* Track # or Play Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isCurrent ? (
          <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent)', borderRadius: '1px' }} title="Playing" />
        ) : (
          <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {track.trackNumber || index + 1 < 10 ? `0${track.trackNumber || index + 1}` : track.trackNumber || index + 1}
          </span>
        )}
      </div>

      {/* Track Title */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: isCurrent ? 700 : 600, fontSize: '13px', color: isCurrent ? 'var(--accent)' : 'var(--text)' }}>
          {track.title}
        </div>
      </div>

      {/* Artist */}
      {showArtist && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {track.artist}
        </div>
      )}

      {/* Album */}
      {showAlbum && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {track.album}
        </div>
      )}

      {/* Duration */}
      <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
        {formatTime(track.duration)}
      </div>

      {/* Action Buttons */}
      <div 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => toggleFavorite(track.id)}
          className="btn-icon"
          style={{ width: '26px', height: '26px', border: 'none' }}
          title={isFav ? 'Remove Favorite' : 'Favorite'}
        >
          <Heart size={13} fill={isFav ? 'currentColor' : 'none'} color={isFav ? 'var(--accent)' : 'var(--text-secondary)'} />
        </button>

        <button
          onClick={() => addToQueue(track)}
          className="btn-icon"
          style={{ width: '26px', height: '26px', border: 'none' }}
          title="Add to Queue"
        >
          <Plus size={14} color="var(--text-secondary)" />
        </button>
      </div>
    </div>
  );
};

export const TrackTable: React.FC<{ tracks: Track[]; showAlbum?: boolean; showArtist?: boolean }> = ({
  tracks,
  showAlbum = true,
  showArtist = true
}) => {
  if (tracks.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        [ NO TRACKS AVAILABLE IN THIS SELECTION ]
      </div>
    );
  }

  return (
    <div style={{ width: '100%', border: 'var(--border-width) solid var(--border)', backgroundColor: 'var(--bg)' }}>
      {/* Table Header */}
      <div
        className="sticky-header"
        style={{
          display: 'grid',
          gridTemplateColumns: showAlbum 
            ? '40px 1fr 180px 180px 70px 70px' 
            : '40px 1fr 180px 70px 70px',
          padding: '8px 16px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          letterSpacing: '0.06em',
          gap: '8px'
        }}
      >
        <div style={{ textAlign: 'center' }}>#</div>
        <div>TITLE</div>
        {showArtist && <div>ARTIST</div>}
        {showAlbum && <div>ALBUM</div>}
        <div style={{ textAlign: 'right' }}>TIME</div>
        <div style={{ textAlign: 'right' }}>ACTION</div>
      </div>

      {/* Rows */}
      {tracks.map((trk, i) => (
        <TrackRow 
          key={trk.id} 
          track={trk} 
          index={i} 
          showAlbum={showAlbum} 
          showArtist={showArtist} 
        />
      ))}
    </div>
  );
};
