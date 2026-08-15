import React, { useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Volume2, VolumeX } from 'lucide-react';

export const VolumeControl: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { volume, isMuted, setVolume, toggleMute } = usePlayer();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const displayVol = isMuted ? 0 : volume;

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newVol = Math.round(ratio * 100);
    setVolume(newVol);
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={toggleMute} className="btn-icon" style={{ width: '28px', height: '28px', border: 'none' }} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <span className="font-mono" style={{ fontSize: '11px', minWidth: '10px', color: 'var(--text-secondary)' }}>−</span>
        <div
          ref={trackRef}
          onClick={handleSliderClick}
          className="hardware-slider-track"
          style={{ width: '80px' }}
        >
          <div className="hardware-slider-rail">
            <div className="hardware-slider-fill" style={{ width: `${displayVol}%` }} />
            <div className="hardware-slider-thumb" style={{ left: `${displayVol}%` }} />
          </div>
        </div>
        <span className="font-mono" style={{ fontSize: '11px', minWidth: '10px', color: 'var(--text-secondary)' }}>+</span>
        <span className="font-mono" style={{ fontSize: '11px', minWidth: '22px', textAlign: 'right', fontWeight: 600 }}>
          {displayVol}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
          VOLUME LEVEL
        </span>
        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700 }}>
          {displayVol} / 100
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={toggleMute} className="btn-icon" title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700 }}>−</span>
        <div
          ref={trackRef}
          onClick={handleSliderClick}
          className="hardware-slider-track"
          style={{ flex: 1 }}
        >
          <div className="hardware-slider-rail" style={{ height: '3px' }}>
            <div className="hardware-slider-fill" style={{ width: `${displayVol}%` }} />
            <div className="hardware-slider-thumb" style={{ left: `${displayVol}%`, width: '12px', height: '16px' }} />
          </div>
        </div>
        <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700 }}>+</span>
      </div>
    </div>
  );
};
