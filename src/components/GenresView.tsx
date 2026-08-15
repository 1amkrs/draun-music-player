import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { MOCK_GENRES } from '../data/mockLibrary';
import { TrackTable } from './TrackRow';
import { Layers, ArrowLeft } from 'lucide-react';

export const GenresView: React.FC = () => {
  const { activeGenre, openGenreDetail, setViewState, tracks } = usePlayer();

  if (activeGenre) {
    const genreTracks = tracks.filter(t => t.genre.toLowerCase().includes(activeGenre.toLowerCase()));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <button onClick={() => openGenreDetail('')} className="btn-hardware" style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}>
            <ArrowLeft size={14} />
            <span>GENRE CLASSIFICATIONS</span>
          </button>
        </div>

        <div
          style={{
            border: 'var(--border-width) solid var(--border)',
            backgroundColor: 'var(--surface)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
            [GENRE ARCHIVE]
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 700, textTransform: 'uppercase' }}>
            {activeGenre}
          </h2>
          <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {genreTracks.length} TRACKS MATCHED
          </span>
        </div>

        <TrackTable tracks={genreTracks} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
        GENRE CLASSIFICATION SYSTEM ({MOCK_GENRES.length} GENRES)
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 'var(--density-grid-gap)'
        }}
      >
        {MOCK_GENRES.map((genre) => {
          const count = tracks.filter(t => t.genre.toLowerCase().includes(genre.toLowerCase())).length;
          return (
            <div
              key={genre}
              onClick={() => openGenreDetail(genre)}
              style={{
                border: 'var(--border-width) solid var(--border)',
                backgroundColor: 'var(--bg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer'
              }}
              className="btn-hardware-hover"
            >
              <Layers size={20} color="var(--accent)" />
              <div style={{ fontWeight: 700, fontSize: '16px', textTransform: 'uppercase' }}>
                {genre}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {count} TRACKS
                </span>
                <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600 }}>
                  EXPLORE →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
