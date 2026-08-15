import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { DisplayMode, EinkSubMode } from '../types/music';

export const DisplayModeSelector: React.FC = () => {
  const { settings, setDisplayMode, setEinkSubMode } = usePlayer();

  const modes: { id: DisplayMode; label: string; number: string }[] = [
    { id: 'eink', label: 'E-INK', number: '01' },
    { id: 'standard', label: 'STANDARD', number: '02' },
    { id: 'dark', label: 'DARK', number: '03' },
    { id: 'high-contrast', label: 'HI-CONTRAST', number: '04' },
  ];

  const einkSubModes: { id: EinkSubMode; label: string }[] = [
    { id: '1bit', label: '1-BIT DITHER' },
    { id: '4gray', label: '4-GRAY' },
    { id: 'grayscale', label: 'GRAYSCALE' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          DISPLAY MODE
        </span>
        <span className="font-mono" style={{ fontSize: '10px', color: 'var(--accent)' }}>
          [{settings.displayMode.toUpperCase()}]
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setDisplayMode(m.id)}
            className={`btn-hardware ${settings.displayMode === m.id ? 'active' : ''}`}
            style={{ padding: '6px 8px', fontSize: '11px', justifyContent: 'flex-start', gap: '6px' }}
          >
            <span className="font-mono" style={{ opacity: 0.6, fontSize: '10px' }}>{m.number}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Submode options when E-INK mode is active */}
      {(settings.displayMode === 'eink' || settings.displayMode === 'high-contrast') && (
        <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: 'var(--border-width) solid var(--border)' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            E-INK BITMAP DITHERING:
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {einkSubModes.map(sub => (
              <button
                key={sub.id}
                onClick={() => setEinkSubMode(sub.id)}
                className={`btn-hardware ${settings.einkSubMode === sub.id ? 'active' : ''}`}
                style={{ flex: 1, padding: '4px 6px', fontSize: '9px', justifyContent: 'center' }}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
