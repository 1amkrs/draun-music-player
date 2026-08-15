import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { ViewState } from '../types/music';
import { Home, Disc, Search, Settings } from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  const { viewState, setViewState } = usePlayer();

  const navs: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'HOME', icon: <Home size={18} /> },
    { id: 'albums', label: 'LIBRARY', icon: <Disc size={18} /> },
    { id: 'search', label: 'SEARCH', icon: <Search size={18} /> },
    { id: 'settings', label: 'SETTINGS', icon: <Settings size={18} /> },
  ];

  return (
    <nav
      style={{
        height: '56px',
        backgroundColor: 'var(--surface)',
        borderTop: 'var(--border-width) solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        position: 'relative',
        zIndex: 85
      }}
    >
      {navs.map(n => {
        const active = viewState === n.id || (n.id === 'albums' && ['albums', 'artists', 'songs', 'playlists', 'genres'].includes(viewState));
        return (
          <button
            key={n.id}
            onClick={() => setViewState(n.id)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: active ? 700 : 500
            }}
          >
            {n.icon}
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              {n.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
