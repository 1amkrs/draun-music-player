import React, { useState, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from './ProgressBar';
import { Play, Pause, SkipBack, SkipForward, Disc, Music, Search as SearchIcon, ListMusic } from 'lucide-react';
import { TrackTable } from './TrackRow';
import { AlbumGrid } from './AlbumCard';

export const BraunApplianceView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    currentTime,
    duration,
    seekTo,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    nextTrack,
    previousTrack,
    albums,
    tracks,
    playlists,
    setViewState
  } = usePlayer();

  const [dialRotation, setDialRotation] = useState<number>(0);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'tracks' | 'albums' | 'playlists'>('tracks');

  const isDraggingRef = useRef<boolean>(false);
  const lastAngleRef = useRef<number>(0);
  const dialRef = useRef<HTMLDivElement | null>(null);

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  // Calculate which tuning dot index (0 to 7) the orange line should be above
  const activeDotIndex = Math.min(7, Math.floor((percent / 100) * 8));

  // Rotatable Physical Wheel Dial logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dialRef.current) return;
    isDraggingRef.current = true;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const delta = currentAngle - lastAngleRef.current;
    lastAngleRef.current = currentAngle;

    const deg = (delta * 180) / Math.PI;
    setDialRotation(prev => (prev + deg) % 360);

    // Scrub track forward or backward slightly based on wheel rotation
    if (duration > 0) {
      const seekDelta = (deg / 360) * 20; // 20 seconds per full turn
      seekTo(Math.max(0, Math.min(duration, currentTime + seekDelta)));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        minHeight: '100%',
        userSelect: 'none',
        backgroundColor: 'var(--bg)'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Braun Hardware Device Casing */}
      <div
        style={{
          width: '380px',
          maxWidth: '100%',
          backgroundColor: '#F5F3ED',
          border: '1px solid #D5D2C5',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.09), 0 4px 12px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* TOP SECTION: Power button & Dot-Matrix Screen */}
        <div
          style={{
            height: '92px',
            borderBottom: '1px solid #D8D4C7',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F5F3ED'
          }}
        >
          {/* Top Left Convex Power Button */}
          <div
            style={{
              width: '96px',
              height: '100%',
              borderRight: '1px solid #D8D4C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <button
              onClick={togglePlayPause}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#F0ECE1',
                border: '1px solid #D2CDC0',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.9), 0 3px 6px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none'
              }}
              title={isPlaying ? 'Pause Playback' : 'Start Playback'}
            >
              {/* Braun Orange Center Indicator Dot */}
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: '#D96C32',
                  boxShadow: isPlaying ? '0 0 8px rgba(217, 108, 50, 0.8)' : 'none',
                  opacity: isMuted ? 0.4 : 1
                }}
              />
            </button>
          </div>

          {/* Top Right Dot Matrix LCD Display */}
          <div
            onClick={() => setShowDrawer(!showDrawer)}
            style={{
              flex: 1,
              height: '100%',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: '#F0ECE1',
              fontFamily: "'Silkscreen', 'Space Mono', monospace",
              cursor: 'pointer'
            }}
            title="Click screen to open library catalog drawer"
          >
            <div
              style={{
                fontSize: '16px',
                letterSpacing: '0.08em',
                color: '#191919',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontWeight: 700
              }}
            >
              {currentTrack ? currentTrack.title.toUpperCase() : 'NPR LIVE'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666660', letterSpacing: '0.06em' }}>
              <span>{formatTime(currentTime)}</span>
              <span>{currentTrack ? currentTrack.artist.toUpperCase().slice(0, 12) : 'MAR 20'}</span>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Perforated Speaker Grille */}
        <div
          style={{
            padding: '24px 20px',
            backgroundColor: '#F5F3ED',
            borderBottom: '1px solid #D8D4C7',
            display: 'grid',
            gridTemplateColumns: 'repeat(20, 1fr)',
            gap: '6px 7px',
            justifyItems: 'center'
          }}
        >
          {Array.from({ length: 360 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#1E1E1E',
                opacity: isPlaying && i % 11 === Math.floor(currentTime % 11) ? 0.95 : 0.84
              }}
            />
          ))}
        </div>

        {/* BOTTOM CONTROL PANEL SECTION */}
        <div
          style={{
            padding: '20px 24px 24px 24px',
            backgroundColor: '#F5F3ED',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}
        >
          {/* Tuning Scale with Braun Orange Indicator Bar */}
          <div style={{ position: 'relative', width: '100%', height: '16px', display: 'flex', alignItems: 'center' }}>
            {/* 8 Spaced Dots Scale */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => seekTo((idx / 7) * duration)}
                  style={{ 
                    width: '3px', 
                    height: '3px', 
                    borderRadius: '50%', 
                    backgroundColor: '#191919',
                    cursor: 'pointer' 
                  }} 
                />
              ))}
            </div>

            {/* Moveable Braun Orange Line Indicator */}
            <div
              style={{
                position: 'absolute',
                top: '-1px',
                left: `calc(8px + ${percent * 0.95}%)`,
                transform: 'translateX(-50%)',
                width: '16px',
                height: '3px',
                backgroundColor: '#D96C32',
                borderRadius: '1px',
                transition: isDraggingRef.current ? 'none' : 'left 150ms linear'
              }}
            />
          </div>

          {/* Lower Control Elements: Logo, Dial, Visualizer Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            {/* Bottom Left Logo: DRAUN In Framer */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  color: '#191919',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1
                }}
              >
                DRAUN
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif', color: '#888880', marginTop: '2px' }}>
                In Framer
              </span>
            </div>

            {/* Bottom Center Rotatable Physical Wheel Dial */}
            <div
              ref={dialRef}
              onMouseDown={handleMouseDown}
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '50%',
                backgroundColor: '#EBE7DC',
                border: '1px solid #C9C4B6',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                position: 'relative',
                transform: `rotate(${dialRotation}deg)`,
                transition: isDraggingRef.current ? 'none' : 'transform 100ms ease-out'
              }}
              title="Click and rotate wheel to scrub audio"
            >
              {/* Outer Concentric Groove Ring */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '1px solid #D5D0C2',
                  position: 'absolute'
                }}
              />

              {/* Recessed Finger Cup Pit */}
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#D2CDC0',
                  border: '1px solid #B8B3A5',
                  position: 'absolute',
                  top: '14px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                }}
              />

              {/* Center Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#F5F3ED',
                  border: '1px solid #C9C4B6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                title="Play / Pause"
              >
                {isPlaying ? <Pause size={16} color="#191919" /> : <Play size={16} color="#191919" style={{ marginLeft: '2px' }} />}
              </button>
            </div>

            {/* Bottom Right Dot-Matrix Play Icon (Triangle of dots + line) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                {/* Dot Triangle Play Pattern */}
                <circle cx="4" cy="12" r="1.5" fill="#191919"/>
                <circle cx="10" cy="9" r="1.5" fill="#191919"/>
                <circle cx="10" cy="15" r="1.5" fill="#191919"/>
                <circle cx="16" cy="6" r="1.5" fill="#191919"/>
                <circle cx="16" cy="12" r="1.5" fill="#191919"/>
                <circle cx="16" cy="18" r="1.5" fill="#191919"/>
                <circle cx="22" cy="12" r="1.5" fill="#191919"/>
                <line x1="26" y1="12" x2="44" y2="12" stroke="#191919" stroke-width="1.5" stroke-dasharray="2 2"/>
              </svg>
              <span className="font-mono" style={{ fontSize: '9px', color: '#777770' }}>
                VOL {volume}%
              </span>
            </div>
          </div>

          {/* Quick Hardware Controls & Library Drawer Trigger */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #E2DDD0' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={previousTrack} className="btn-hardware" style={{ padding: '6px 12px', fontSize: '10px', gap: '4px' }}>
                <SkipBack size={12} /> PREV
              </button>
              <button onClick={togglePlayPause} className="btn-hardware active" style={{ padding: '6px 14px', fontSize: '10px', gap: '4px' }}>
                {isPlaying ? <Pause size={12} /> : <Play size={12} />} {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <button onClick={nextTrack} className="btn-hardware" style={{ padding: '6px 12px', fontSize: '10px', gap: '4px' }}>
                NEXT <SkipForward size={12} />
              </button>
            </div>

            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className={`btn-hardware ${showDrawer ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '10px', gap: '6px' }}
            >
              <ListMusic size={12} />
              <span>{showDrawer ? 'CLOSE CATALOG' : 'MUSIC CATALOG'}</span>
            </button>
          </div>
        </div>

        {/* INTEGRATED MUSIC CATALOG DRAWER OVERLAY */}
        {showDrawer && (
          <div
            style={{
              position: 'absolute',
              top: '92px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#F5F3ED',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid #D8D4C7',
              animation: 'fadeIn 150ms ease-out'
            }}
          >
            {/* Drawer Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #D8D4C7', backgroundColor: '#ECE8DD' }}>
              <button
                onClick={() => setDrawerTab('tracks')}
                className={`btn-hardware ${drawerTab === 'tracks' ? 'active' : ''}`}
                style={{ flex: 1, borderRadius: 0, border: 'none', borderRight: '1px solid #D8D4C7', padding: '10px' }}
              >
                TRACKS ({tracks.length})
              </button>
              <button
                onClick={() => setDrawerTab('albums')}
                className={`btn-hardware ${drawerTab === 'albums' ? 'active' : ''}`}
                style={{ flex: 1, borderRadius: 0, border: 'none', borderRight: '1px solid #D8D4C7', padding: '10px' }}
              >
                ALBUMS ({albums.length})
              </button>
              <button
                onClick={() => setViewState('home')}
                className="btn-hardware"
                style={{ borderRadius: 0, border: 'none', padding: '10px 16px' }}
              >
                FULL UI &rarr;
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {drawerTab === 'tracks' ? (
                <TrackTable tracks={tracks} showAlbum={false} />
              ) : (
                <AlbumGrid albums={albums} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
