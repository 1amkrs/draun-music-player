import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, ListMusic } from 'lucide-react';

interface PlaybackControlsProps {
  layout?: 'row' | 'large';
  showLabels?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  layout = 'row',
  showLabels = false
}) => {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    previousTrack,
    nextTrack,
    shuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    favorites,
    toggleFavorite,
    isQueueOpen,
    setIsQueueOpen
  } = usePlayer();

  const isFav = currentTrack ? favorites.includes(currentTrack.id) : false;

  if (layout === 'large') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
        {/* Primary Hardware Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={previousTrack}
            className="btn-hardware"
            style={{ width: '56px', height: '56px', padding: 0 }}
            title="Previous Track (Left Arrow)"
          >
            <SkipBack size={24} />
          </button>

          <button
            onClick={togglePlayPause}
            className="btn-primary-play"
            style={{ width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Play / Pause (Spacebar)"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
          </button>

          <button
            onClick={nextTrack}
            className="btn-hardware"
            style={{ width: '56px', height: '56px', padding: 0 }}
            title="Next Track (Right Arrow)"
          >
            <SkipForward size={24} />
          </button>
        </div>

        {/* Secondary Hardware Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleShuffle}
            className={`btn-hardware ${shuffle ? 'active' : ''}`}
            style={{ padding: '8px 12px', fontSize: '11px', gap: '6px' }}
            title="Shuffle (S)"
          >
            <Shuffle size={14} />
            {showLabels && <span>SHUFFLE</span>}
          </button>

          <button
            onClick={toggleRepeat}
            className={`btn-hardware ${repeatMode !== 'off' ? 'active' : ''}`}
            style={{ padding: '8px 12px', fontSize: '11px', gap: '6px' }}
            title={`Repeat: ${repeatMode.toUpperCase()}`}
          >
            <Repeat size={14} />
            {showLabels && <span>{repeatMode === 'one' ? 'REPEAT 1' : 'REPEAT ALL'}</span>}
          </button>

          {currentTrack && (
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`btn-hardware ${isFav ? 'active' : ''}`}
              style={{ padding: '8px 12px', fontSize: '11px', gap: '6px' }}
              title="Toggle Favorite (F)"
            >
              <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
              {showLabels && <span>{isFav ? 'FAVORITED' : 'FAVORITE'}</span>}
            </button>
          )}

          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`btn-hardware ${isQueueOpen ? 'active' : ''}`}
            style={{ padding: '8px 12px', fontSize: '11px', gap: '6px' }}
            title="Toggle Queue Panel (Q)"
          >
            <ListMusic size={14} />
            {showLabels && <span>QUEUE</span>}
          </button>
        </div>
      </div>
    );
  }

  // Row layout for bottom persistent player bar
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={toggleShuffle}
        className={`btn-icon ${shuffle ? 'active' : ''}`}
        style={{ width: '32px', height: '32px' }}
        title="Shuffle (S)"
      >
        <Shuffle size={14} />
      </button>

      <button
        onClick={previousTrack}
        className="btn-icon"
        style={{ width: '32px', height: '32px' }}
        title="Previous Track (Left Arrow)"
      >
        <SkipBack size={16} />
      </button>

      <button
        onClick={togglePlayPause}
        className="btn-primary-play"
        style={{ width: '38px', height: '38px' }}
        title="Play / Pause (Spacebar)"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
      </button>

      <button
        onClick={nextTrack}
        className="btn-icon"
        style={{ width: '32px', height: '32px' }}
        title="Next Track (Right Arrow)"
      >
        <SkipForward size={16} />
      </button>

      <button
        onClick={toggleRepeat}
        className={`btn-icon ${repeatMode !== 'off' ? 'active' : ''}`}
        style={{ width: '32px', height: '32px' }}
        title={`Repeat: ${repeatMode.toUpperCase()}`}
      >
        <Repeat size={14} />
      </button>

      {currentTrack && (
        <button
          onClick={() => toggleFavorite(currentTrack.id)}
          className={`btn-icon ${isFav ? 'active' : ''}`}
          style={{ width: '32px', height: '32px' }}
          title="Favorite (F)"
        >
          <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
};
