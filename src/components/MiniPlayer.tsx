import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { AlbumArt } from './AlbumArt';
import { Maximize2, ListMusic } from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const { currentTrack, setViewState, isQueueOpen, setIsQueueOpen, settings } = usePlayer();

  if (!currentTrack) {
    return (
      <div
        style={{
          height: '64px',
          borderTop: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}
      >
        DRAUN AP-26 — NO TRACK LOADED
      </div>
    );
  }

  const isArtOn = settings.artMode === 'on';

  return (
    <div
      style={{
        height: '64px',
        borderTop: 'var(--border-width) solid var(--border)',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        gap: '16px',
        position: 'relative',
        zIndex: 80
      }}
    >
      {/* Left: Track & Artist Info + Artwork */}
      <div
        onClick={() => setViewState('now-playing')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          flex: '0 1 280px',
          minWidth: 0
        }}
        title="Open Now Playing"
      >
        {isArtOn && (
          <AlbumArt src={currentTrack.cover} alt={currentTrack.title} size={44} />
        )}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {currentTrack.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {currentTrack.artist} — {currentTrack.album}
          </div>
        </div>
      </div>

      {/* Center: Playback Controls & Instrument Progress Readout */}
      <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', maxWidth: '600px' }}>
        <PlaybackControls layout="row" />
        <ProgressBar compact />
      </div>

      {/* Right: Volume & Queue / Expand Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 260px', justifyContent: 'flex-end' }}>
        <VolumeControl compact />

        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className={`btn-icon ${isQueueOpen ? 'active' : ''}`}
          style={{ width: '32px', height: '32px' }}
          title="Toggle Queue Drawer (Q)"
        >
          <ListMusic size={15} />
        </button>

        <button
          onClick={() => setViewState('now-playing')}
          className="btn-icon"
          style={{ width: '32px', height: '32px' }}
          title="Full Screen Now Playing"
        >
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
};
