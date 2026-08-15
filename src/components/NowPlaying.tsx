import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { AlbumArt } from './AlbumArt';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { ArtworkToggle } from './ArtworkToggle';
import { ArrowLeft, Image, ImageOff } from 'lucide-react';

export const NowPlaying: React.FC = () => {
  const { currentTrack, setViewState, settings, toggleArtMode } = usePlayer();

  if (!currentTrack) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        [ NO TRACK LOADED FOR PLAYBACK ]
      </div>
    );
  }

  const isArtOn = settings.artMode === 'on';
  const isEink = settings.displayMode === 'eink' || settings.displayMode === 'high-contrast';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '24px 16px',
        gap: '24px',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Bar Navigation */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setViewState('home')} className="btn-hardware" style={{ gap: '6px', padding: '6px 12px', fontSize: '11px' }}>
          <ArrowLeft size={14} />
          <span>RETURN TO LIBRARY</span>
        </button>

        <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em' }}>
          [NOW PLAYING AP-26]
        </div>

        <button onClick={toggleArtMode} className="btn-hardware" style={{ gap: '6px', padding: '6px 10px', fontSize: '11px' }}>
          {isArtOn ? <ImageOff size={14} /> : <Image size={14} />}
          <span>ART {isArtOn ? 'OFF' : 'ON'}</span>
        </button>
      </div>

      {/* Main Composition Switcher: ART MODE vs TEXT MODE vs E-INK MODE */}
      {isArtOn ? (
        /* ART MODE COMPOSITION */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', flex: 1, justifyContent: 'center' }}>
          <AlbumArt src={currentTrack.cover} alt={currentTrack.title} size={320} className="now-playing-large-art" />

          {/* Typography Header */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '500px' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {currentTrack.artist}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {currentTrack.title}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {currentTrack.album} &bull; <span className="font-mono">{currentTrack.year}</span>
            </div>
          </div>
        </div>
      ) : (
        /* TEXT MODE COMPOSITION (Stark Instrument Display) */
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '16px', 
            width: '100%', 
            flex: 1,
            border: 'var(--border-width) solid var(--border)',
            backgroundColor: 'var(--surface)',
            padding: '32px 20px',
            textAlign: 'center'
          }}
        >
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
            AUDIO REPRODUCER READOUT
          </span>

          <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '8px' }}>
            {currentTrack.artist}
          </div>

          <h2 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1.15, maxWidth: '600px' }}>
            {currentTrack.title}
          </h2>

          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            ALBUM: {currentTrack.album} &bull; <span className="font-mono">{currentTrack.year}</span>
          </div>

          <div className="font-mono" style={{ fontSize: '12px', border: 'var(--border-width) solid var(--border)', padding: '4px 12px', marginTop: '8px', backgroundColor: 'var(--bg)' }}>
            GENRE: {currentTrack.genre.toUpperCase()} &bull; TRACK #{currentTrack.trackNumber}
          </div>
        </div>
      )}

      {/* Progress Instrument Bar */}
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <ProgressBar />
      </div>

      {/* Primary & Secondary Hardware Playback Controls */}
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <PlaybackControls layout="large" showLabels />
        <div style={{ width: '100%', maxWidth: '320px' }}>
          <VolumeControl />
        </div>
      </div>
    </div>
  );
};
