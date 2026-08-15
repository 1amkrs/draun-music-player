import React from 'react';
import { Album } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { AlbumArt } from './AlbumArt';
import { LayoutGrid, List } from 'lucide-react';

export const AlbumCard: React.FC<{ album: Album }> = ({ album }) => {
  const { openAlbumDetail, settings } = usePlayer();
  const isArtOn = settings.artMode === 'on';

  return (
    <div
      onClick={() => openAlbumDetail(album)}
      style={{
        border: 'var(--border-width) solid var(--border)',
        backgroundColor: 'var(--bg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'pointer',
        userSelect: 'none'
      }}
      className="btn-hardware-hover"
    >
      {/* Artwork Box if ART ON */}
      {isArtOn && (
        <AlbumArt src={album.cover} alt={album.title} size={220} className="album-card-art" />
      )}

      {/* Typography Metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {album.title}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {album.artist}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {album.year}
          </span>
          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {album.tracks.length} TRACKS
          </span>
        </div>
      </div>
    </div>
  );
};

export const AlbumList: React.FC<{ albums: Album[] }> = ({ albums }) => {
  const { openAlbumDetail } = usePlayer();

  return (
    <div style={{ border: 'var(--border-width) solid var(--border)', backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="sticky-header"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px 100px 100px',
          padding: '8px 16px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          letterSpacing: '0.06em'
        }}
      >
        <div>ALBUM TITLE</div>
        <div>ARTIST</div>
        <div style={{ textAlign: 'center' }}>YEAR</div>
        <div style={{ textAlign: 'right' }}>TRACKS</div>
      </div>

      {albums.map((alb) => (
        <div
          key={alb.id}
          onClick={() => openAlbumDetail(alb)}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 200px 100px 100px',
            alignItems: 'center',
            padding: 'var(--density-padding)',
            minHeight: 'var(--density-row-height)',
            borderBottom: 'var(--border-width) solid var(--border)',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '14px' }}>{alb.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{alb.artist}</div>
          <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>{alb.year}</div>
          <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{alb.tracks.length}</div>
        </div>
      ))}
    </div>
  );
};

export const AlbumGrid: React.FC<{ albums: Album[] }> = ({ albums }) => {
  const { gridMode, setGridMode } = usePlayer();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Density / View Switcher Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          TOTAL ALBUMS: {albums.length}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setGridMode('grid')}
            className={`btn-hardware ${gridMode === 'grid' ? 'active' : ''}`}
            style={{ padding: '6px 10px', fontSize: '11px', gap: '6px' }}
          >
            <LayoutGrid size={14} />
            <span>GRID</span>
          </button>
          <button
            onClick={() => setGridMode('list')}
            className={`btn-hardware ${gridMode === 'list' ? 'active' : ''}`}
            style={{ padding: '6px 10px', fontSize: '11px', gap: '6px' }}
          >
            <List size={14} />
            <span>LIST</span>
          </button>
        </div>
      </div>

      {gridMode === 'list' ? (
        <AlbumList albums={albums} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 'var(--density-grid-gap)'
          }}
        >
          {albums.map(alb => (
            <AlbumCard key={alb.id} album={alb} />
          ))}
        </div>
      )}
    </div>
  );
};
