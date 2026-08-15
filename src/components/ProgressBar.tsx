import React, { useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
  const padMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${padMins}:${padSecs}`;
}

export const ProgressBar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentTime, duration, seekTo } = usePlayer();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(ratio * duration);
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        <span className="font-mono" style={{ fontSize: '11px', minWidth: '38px', color: 'var(--text-secondary)' }}>
          {formatTime(currentTime)}
        </span>
        <div 
          ref={trackRef}
          onClick={handleSeek}
          className="hardware-slider-track"
          style={{ flex: 1 }}
          role="slider"
          aria-valuenow={currentTime}
          aria-valuemax={duration}
          tabIndex={0}
        >
          <div className="hardware-slider-rail">
            <div className="hardware-slider-fill" style={{ width: `${percent}%` }} />
            <div className="hardware-slider-thumb" style={{ left: `${percent}%` }} />
          </div>
        </div>
        <span className="font-mono" style={{ fontSize: '11px', minWidth: '38px', textAlign: 'right', color: 'var(--text-secondary)' }}>
          {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div 
        ref={trackRef}
        onClick={handleSeek}
        className="hardware-slider-track"
        style={{ height: '20px' }}
        role="slider"
        aria-valuenow={currentTime}
        aria-valuemax={duration}
        tabIndex={0}
      >
        <div className="hardware-slider-rail" style={{ height: '3px' }}>
          <div className="hardware-slider-fill" style={{ width: `${percent}%` }} />
          <div className="hardware-slider-thumb" style={{ left: `${percent}%`, width: '12px', height: '16px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-mono" style={{ fontSize: '13px', fontWeight: 600 }}>
          {formatTime(currentTime)}
        </span>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          ELAPSED / REMAINING: -{formatTime(Math.max(0, duration - currentTime))}
        </span>
        <span className="font-mono" style={{ fontSize: '13px', fontWeight: 600 }}>
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
