import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Image, ImageOff } from 'lucide-react';

export const ArtworkToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { settings, toggleArtMode } = usePlayer();
  const isArtOn = settings.artMode === 'on';

  if (compact) {
    return (
      <button
        onClick={toggleArtMode}
        className={`btn-hardware ${isArtOn ? 'active' : ''}`}
        title={`Album Art: ${isArtOn ? 'ON' : 'OFF'}`}
        style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
      >
        {isArtOn ? <Image size={14} /> : <ImageOff size={14} />}
        <span>ART {isArtOn ? 'ON' : 'OFF'}</span>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        ARTWORK DISPLAY
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <button
          onClick={() => isArtOn || toggleArtMode()}
          className={`btn-hardware ${isArtOn ? 'active' : ''}`}
          style={{ justifyContent: 'center' }}
        >
          ART ON
        </button>
        <button
          onClick={() => !isArtOn || toggleArtMode()}
          className={`btn-hardware ${!isArtOn ? 'active' : ''}`}
          style={{ justifyContent: 'center' }}
        >
          ART OFF
        </button>
      </div>
    </div>
  );
};
