import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { ViewState } from '../types/music';
import { DisplayModeSelector } from './DisplayModeSelector';
import { ArtworkToggle } from './ArtworkToggle';
import { DensityToggle } from './ModeToggle';
import { 
  Home, Disc, Users, Music2, Layers, ListMusic, 
  Heart, History, FolderDown, Settings, Search, Disc3, Radio 
} from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const { viewState, setViewState, tracks, favorites, playlists } = usePlayer();

  const navItems: { section: string; items: { id: ViewState; label: string; icon: React.ReactNode; count?: number }[] }[] = [
    {
      section: 'MUSIC',
      items: [
        { id: 'home', label: 'HOME', icon: <Home size={16} /> },
        { id: 'albums', label: 'ALBUMS', icon: <Disc size={16} /> },
        { id: 'artists', label: 'ARTISTS', icon: <Users size={16} /> },
        { id: 'songs', label: 'SONGS', icon: <Music2 size={16} />, count: tracks.length },
        { id: 'genres', label: 'GENRES', icon: <Layers size={16} /> },
      ]
    },
    {
      section: 'COLLECTION',
      items: [
        { id: 'playlists', label: 'PLAYLISTS', icon: <ListMusic size={16} />, count: playlists.length },
        { id: 'favorites', label: 'FAVORITES', icon: <Heart size={16} />, count: favorites.length },
        { id: 'recently-played', label: 'RECENTLY PLAYED', icon: <History size={16} /> },
      ]
    },
    {
      section: 'HARDWARE',
      items: [
        { id: 'appliance', label: 'BRAUN CHASSIS', icon: <Radio size={16} /> },
        { id: 'search', label: 'SEARCH', icon: <Search size={16} /> },
        { id: 'settings', label: 'SETTINGS', icon: <Settings size={16} /> },
      ]
    }
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--surface)',
        borderRight: 'var(--border-width) solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none'
      }}
    >
      {/* Braun Industrial Header Badge */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: 'var(--border-width) solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--accent)', borderRadius: '2px' }} />
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.08em' }}>DRAUN</span>
          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>AP-26</span>
        </div>
        <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
          DIGITAL MUSIC APPLIANCE
        </span>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {navItems.map((sec, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', letterSpacing: '0.08em', padding: '0 8px' }}>
              {sec.section}
            </span>
            {sec.items.map(item => {
              const active = viewState === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setViewState(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius)',
                    backgroundColor: active ? 'var(--text)' : 'transparent',
                    color: active ? 'var(--bg)' : 'var(--text)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '12px',
                    letterSpacing: '0.04em',
                    border: '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className="font-mono" style={{ fontSize: '10px', opacity: active ? 0.9 : 0.6 }}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        <hr style={{ borderColor: 'var(--border)', borderStyle: 'solid', borderWidth: '0 0 1px 0', margin: '4px 0' }} />

        {/* Display Mode Hardware Controls */}
        <DisplayModeSelector />
        <ArtworkToggle />
        <DensityToggle />
      </div>

      {/* Footer Info Readout */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>LOCAL LIB</span>
        <span style={{ fontWeight: 700 }}>{tracks.length} TRACKS</span>
      </div>
    </aside>
  );
};
