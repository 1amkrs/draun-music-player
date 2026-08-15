import React, { useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { DisplayModeSelector } from './DisplayModeSelector';
import { ArtworkToggle } from './ArtworkToggle';
import { DensityToggle } from './ModeToggle';
import { FolderPlus, Trash2, HardDrive, Cpu, Radio, Music } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const { 
    settings, 
    setDisplayMode, 
    setDensityLevel, 
    tracks, 
    albums, 
    artists, 
    playlists,
    importLocalFiles 
  } = usePlayer();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      importLocalFiles(e.target.files);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '800px' }}>
      {/* Title Header */}
      <div style={{ borderBottom: 'var(--border-width) solid var(--border)', paddingBottom: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          DEVICE SYSTEM CONFIGURATION
        </h2>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          DRAUN AP-26 SPECIFICATION & PARAMETER ADJUSTMENT
        </span>
      </div>

      {/* SECTION 01: DISPLAY & RENDERING SYSTEM */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
          SECTION 01 // DISPLAY & VISUAL MODES
        </div>
        <DisplayModeSelector />
        <ArtworkToggle />
        <DensityToggle />
      </div>

      {/* SECTION 02: LOCAL AUDIO IMPORT & LIBRARY STORAGE */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
          SECTION 02 // LOCAL MUSIC FILE IMPORT
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Import audio files (.mp3, .wav, .flac, .m4a, .ogg) directly from your device storage into the Draun local playback engine.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-hardware active"
          style={{ gap: '8px', padding: '10px 16px', alignSelf: 'flex-start' }}
        >
          <FolderPlus size={16} />
          <span>IMPORT LOCAL AUDIO FILES</span>
        </button>
      </div>

      {/* SECTION 03: AUDIO ENGINE REPRODUCTION */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
          SECTION 03 // AUDIO REPRODUCTION ENGINE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          <div style={{ padding: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
            <div>SYNTHESIZER ENGINE: <strong style={{ color: 'var(--accent)' }}>WEB AUDIO API</strong></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '4px' }}>Procedural analog harmonic oscillator</div>
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
            <div>NATIVE AUDIO PLAYER: <strong style={{ color: 'var(--accent)' }}>HTML5 AUDIO</strong></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '4px' }}>Local file reader stream</div>
          </div>
        </div>
      </div>

      {/* SECTION 04: HARDWARE & SYSTEM STATUS */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
          SECTION 04 // SYSTEM METRICS & STORAGE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', textAlign: 'center' }}>
          <div style={{ padding: '12px 8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>TOTAL TRACKS</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{tracks.length}</div>
          </div>
          <div style={{ padding: '12px 8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>TOTAL ALBUMS</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{albums.length}</div>
          </div>
          <div style={{ padding: '12px 8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>ARTISTS</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{artists.length}</div>
          </div>
          <div style={{ padding: '12px 8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>FIRMWARE</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>v2026.1</div>
          </div>
        </div>
      </div>
    </div>
  );
};
