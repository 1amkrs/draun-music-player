import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { DensityLevel } from '../types/music';

export const DensityToggle: React.FC = () => {
  const { settings, setDensityLevel } = usePlayer();

  const densities: { id: DensityLevel; label: string }[] = [
    { id: 'comfortable', label: 'COMFORT' },
    { id: 'compact', label: 'COMPACT' },
    { id: 'eink', label: 'E-INK' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        LAYOUT DENSITY
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {densities.map(d => (
          <button
            key={d.id}
            onClick={() => setDensityLevel(d.id)}
            className={`btn-hardware ${settings.densityLevel === d.id ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '6px 4px', fontSize: '10px' }}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
};
