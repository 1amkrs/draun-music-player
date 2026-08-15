import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Search, Image, ImageOff, Disc3 } from 'lucide-react';
import { ArtworkToggle } from './ArtworkToggle';

export const TopBar: React.FC = () => {
  const { viewState, searchQuery, setSearchQuery, setViewState, settings } = usePlayer();

  const getPageTitle = () => {
    switch (viewState) {
      case 'home': return 'LIBRARY OVERVIEW';
      case 'albums': return 'ALBUM CATALOG';
      case 'album-detail': return 'ALBUM VIEW';
      case 'artists': return 'ARTIST DIRECTORY';
      case 'artist-detail': return 'ARTIST PROFILE';
      case 'songs': return 'TRACK INDEX';
      case 'genres': return 'GENRE CLASSIFICATION';
      case 'playlists': return 'PLAYLIST ARCHIVE';
      case 'playlist-detail': return 'PLAYLIST VIEW';
      case 'favorites': return 'STARRED TRACKS';
      case 'recently-played': return 'RECENT PLAYBACK';
      case 'search': return 'LIBRARY SEARCH';
      case 'now-playing': return 'NOW PLAYING INSTRUMENT';
      case 'appliance': return 'BRAUN HARDWARE CHASSIS';
      case 'settings': return 'DEVICE CONFIGURATION';
      default: return 'DRAUN AP-26';
    }
  };

  return (
    <header
      style={{
        height: '52px',
        borderBottom: 'var(--border-width) solid var(--border)',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        gap: '16px'
      }}
    >
      {/* Title & Section Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
          [01]
        </span>
        <h1 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* Quick Search & Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search bar input */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search library... (/)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (viewState !== 'search' && e.target.value.trim().length > 0) {
                setViewState('search');
              }
            }}
            onFocus={() => {
              if (viewState !== 'search') setViewState('search');
            }}
            className="input-hardware"
            style={{ paddingLeft: '30px', paddingRight: '10px', height: '32px', fontSize: '12px' }}
          />
        </div>

        {/* Quick Hardware Chassis Toggle */}
        <button
          onClick={() => setViewState(viewState === 'appliance' ? 'home' : 'appliance')}
          className={`btn-hardware ${viewState === 'appliance' ? 'active' : ''}`}
          style={{ padding: '6px 10px', fontSize: '11px', gap: '6px' }}
          title="Toggle Physical Braun Device View"
        >
          <span>PHYSICAL DEVICE</span>
        </button>

        {/* Quick Artwork toggle */}
        <ArtworkToggle compact />

        {/* Technical mode readout */}
        <div className="font-mono" style={{ fontSize: '10px', border: 'var(--border-width) solid var(--border)', padding: '4px 8px', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)' }}>
          MODE: {settings.displayMode.toUpperCase()}
        </div>
      </div>
    </header>
  );
};
