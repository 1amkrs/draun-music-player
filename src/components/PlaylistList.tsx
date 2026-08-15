import React, { useState } from 'react';
import { Playlist } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { TrackTable } from './TrackRow';
import { ArrowLeft, Plus, Play, ListMusic, Trash2 } from 'lucide-react';
import { formatTime } from './ProgressBar';

export const PlaylistList: React.FC = () => {
  const { playlists, openPlaylistDetail, createPlaylist } = usePlayer();
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createPlaylist(name.trim(), desc.trim());
      setName('');
      setDesc('');
      setShowCreateModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          PLAYLIST ARCHIVE ({playlists.length} PLAYLISTS)
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-hardware active"
          style={{ gap: '6px' }}
        >
          <Plus size={14} />
          <span>NEW PLAYLIST</span>
        </button>
      </div>

      {showCreateModal && (
        <form
          onSubmit={handleCreate}
          style={{
            border: 'var(--border-width) solid var(--border)',
            backgroundColor: 'var(--surface)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '14px' }}>CREATE NEW PLAYLIST</div>
          <input
            type="text"
            placeholder="Playlist Title..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-hardware"
            required
          />
          <input
            type="text"
            placeholder="Optional Description..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="input-hardware"
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-hardware">
              CANCEL
            </button>
            <button type="submit" className="btn-hardware active">
              CREATE ARCHIVE
            </button>
          </div>
        </form>
      )}

      {/* Grid of Playlists */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 'var(--density-grid-gap)'
        }}
      >
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => openPlaylistDetail(pl)}
            style={{
              border: 'var(--border-width) solid var(--border)',
              backgroundColor: 'var(--bg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer'
            }}
            className="btn-hardware-hover"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <ListMusic size={20} color="var(--accent)" />
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {pl.createdAt}
              </span>
            </div>

            <div style={{ fontWeight: 700, fontSize: '16px', textTransform: 'uppercase' }}>
              {pl.name}
            </div>

            {pl.description && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {pl.description}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {pl.tracks.length} TRACKS
              </span>
              <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600 }}>
                OPEN →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PlaylistDetail: React.FC = () => {
  const { activePlaylist, setViewState, playTrack } = usePlayer();

  if (!activePlaylist) {
    return (
      <div style={{ padding: '32px' }}>
        <button onClick={() => setViewState('playlists')} className="btn-hardware">
          <ArrowLeft size={14} style={{ marginRight: '6px' }} />
          BACK TO PLAYLISTS
        </button>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (activePlaylist.tracks.length > 0) {
      playTrack(activePlaylist.tracks[0], activePlaylist.tracks);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <button onClick={() => setViewState('playlists')} className="btn-hardware" style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}>
          <ArrowLeft size={14} />
          <span>PLAYLIST ARCHIVE</span>
        </button>
      </div>

      {/* Playlist Header */}
      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
            [USER PLAYLIST]
          </span>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            CREATED: {activePlaylist.createdAt}
          </span>
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          {activePlaylist.name}
        </h2>

        {activePlaylist.description && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
            {activePlaylist.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button onClick={handlePlayAll} className="btn-hardware active" style={{ gap: '8px', padding: '10px 20px' }}>
            <Play size={16} />
            <span>PLAY PLAYLIST</span>
          </button>
        </div>
      </div>

      {/* Track list */}
      <TrackTable tracks={activePlaylist.tracks} />
    </div>
  );
};
