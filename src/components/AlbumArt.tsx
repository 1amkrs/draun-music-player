import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { renderEinkArtwork } from '../utils/ditherArtwork';

interface AlbumArtProps {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({
  src,
  alt,
  size = 300,
  className = ''
}) => {
  const { settings } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // If ART OFF global state, render nothing so layout REFLOWS seamlessly!
  if (settings.artMode === 'off') {
    return null;
  }

  const isEink = settings.displayMode === 'eink' || settings.displayMode === 'high-contrast';

  useEffect(() => {
    if (isEink && src && canvasRef.current) {
      renderEinkArtwork(src, canvasRef.current, settings.einkSubMode, size);
    }
  }, [src, isEink, settings.einkSubMode, size]);

  if (!src) {
    return (
      <div 
        className={`art-placeholder ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: 'var(--surface)',
          border: 'var(--border-width) solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}
      >
        [ NO ART ]
      </div>
    );
  }

  if (isEink) {
    return (
      <div className={`art-container ${className}`} style={{ width: size, height: size, flexShrink: 0 }}>
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'var(--border-width) solid var(--border)',
            display: 'block' 
          }} 
          aria-label={alt}
        />
      </div>
    );
  }

  return (
    <div className={`art-container ${className}`} style={{ width: size, height: size, flexShrink: 0 }}>
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          border: 'var(--border-width) solid var(--border)',
          display: 'block'
        }}
      />
    </div>
  );
};
