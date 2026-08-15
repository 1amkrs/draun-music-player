/*
  quietshu classic 3D Cover Flow engine adapted for React & E-Ink appliance UI
  Author credit: github.com/quietshu (MIT License)
*/
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Album } from '../types/music';

interface CoverFlowProps {
  albums: Album[];
  activeIndex: number;
  onChange: (index: number) => void;
  onSelect: (album: Album) => void;
  einkSubMode?: '1bit' | '4gray' | 'grayscale' | 'standard';
}

const generateEInkArt = (title: string, artist: string, year?: number, isColor: boolean = false) => {
  const cleanTitle = title.toUpperCase().slice(0, 16);
  const cleanArtist = artist.toUpperCase().slice(0, 18);
  const bg = isColor ? '#282522' : '#F4F1EA';
  const textColor = isColor ? '#FFF' : '#1A1A1A';
  const subColor = isColor ? '#FF9E66' : '#666666';
  const accentColor = '#F36F21';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="${bg}"/>
    <rect x="10" y="10" width="280" height="280" fill="none" stroke="${accentColor}" stroke-width="3"/>
    <circle cx="150" cy="130" r="70" fill="${isColor ? '#F36F21' : '#1A1A1A'}"/>
    <circle cx="150" cy="130" r="22" fill="${bg}"/>
    <circle cx="150" cy="130" r="6" fill="${accentColor}"/>
    <text x="150" y="235" font-family="monospace" font-size="14" font-weight="bold" fill="${textColor}" text-anchor="middle">${cleanTitle}</text>
    <text x="150" y="255" font-family="monospace" font-size="11" fill="${subColor}" text-anchor="middle">${cleanArtist}</text>
    <text x="150" y="272" font-family="monospace" font-size="9" fill="${subColor}" text-anchor="middle">DRAUN HI-RES • ${year || 2026}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const CoverFlow: React.FC<CoverFlowProps> = ({
  albums,
  activeIndex,
  onChange,
  onSelect,
  einkSubMode = 'standard'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const dragDeltaXRef = useRef<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(380);

  const total = albums.length;
  const safeIndex = Math.max(0, Math.min(activeIndex, Math.max(0, total - 1)));
  const currentAlbum = albums[safeIndex] || albums[0] || null;

  // Track parent container width dynamically with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    const rafId = requestAnimationFrame(updateWidth);

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Keyboard controls (Left / Right / A / D / Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (total === 0) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onChange(Math.max(0, safeIndex - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onChange(Math.min(total - 1, safeIndex + 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentAlbum) onSelect(currentAlbum);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeIndex, total, onChange, onSelect, currentAlbum]);

  // Wheel Controls
  const wheelAccumulatorRef = useRef<number>(0);
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (total === 0) return;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    wheelAccumulatorRef.current += delta;

    const threshold = 24;
    if (Math.abs(wheelAccumulatorRef.current) >= threshold) {
      const steps = Math.trunc(wheelAccumulatorRef.current / threshold);
      wheelAccumulatorRef.current %= threshold;
      const nextIdx = Math.max(0, Math.min(total - 1, safeIndex + (steps > 0 ? 1 : -1)));
      if (nextIdx !== safeIndex) {
        onChange(nextIdx);
      }
    }
  }, [safeIndex, total, onChange]);

  // Mouse Drag / Touch Swipe Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    dragDeltaXRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    dragDeltaXRef.current = e.clientX - startXRef.current;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = dragDeltaXRef.current;

    if (Math.abs(delta) > 30) {
      if (delta < 0) {
        onChange(Math.min(total - 1, safeIndex + 1));
      } else {
        onChange(Math.max(0, safeIndex - 1));
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].clientX;
      dragDeltaXRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length === 0) return;
    dragDeltaXRef.current = e.touches[0].clientX - startXRef.current;
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  if (total === 0) {
    const emptyArt = generateEInkArt('NO MUSIC IMPORTED', 'CLICK + IMPORT MEDIA', 2026);
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: einkSubMode === '1bit' ? '#FFFFFF' : '#EEEEEE',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px'
        }}
      >
        <img
          src={emptyArt}
          alt="No Local Music"
          style={{
            width: '130px',
            height: '130px',
            border: '2px solid #1A1A1A',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
          }}
        />
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          <div style={{ fontWeight: 700, fontSize: '12px', color: '#1A1A1A' }}>
            NO LOCAL MUSIC IMPORTED
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '4px' }}>
            CLICK "+ IMPORT" IN THE TOP HEADER TO ADD YOUR LOCAL MUSIC
          </div>
        </div>
      </div>
    );
  }

  // Card dimensions & spacing
  const imgSize = 136;
  const cardGap = 42;
  const sideExtraGap = 62;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: einkSubMode === '1bit' ? '#FFFFFF' : '#EEEEEE',
        userSelect: 'none',
        perspective: '700px',
        perspectiveOrigin: '50% 38%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab'
      }}
    >
      {/* 3D Cover Flow Stage Area */}
      <div
        style={{
          width: '100%',
          height: '210px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d'
        }}
      >
        {albums.map((album, i) => {
          const isCenter = i === safeIndex;
          const isLeft = i < safeIndex;

          let xOffset = 0;
          let degree = 0;
          let z = 30;
          let filter = 'none';
          let zIndex = total;

          if (isLeft) {
            xOffset = (i - safeIndex) * cardGap - sideExtraGap;
            degree = 55;
            z = -60 - (safeIndex - i) * 15;
            filter = 'brightness(0.65)';
            zIndex = i + 1;
          } else if (isCenter) {
            xOffset = 0;
            degree = 0;
            z = 30;
            filter = 'none';
            zIndex = total + 20;
          } else {
            // Right cards
            xOffset = (i - safeIndex) * cardGap + sideExtraGap;
            degree = -55;
            z = -60 - (i - safeIndex) * 15;
            filter = 'brightness(0.65)';
            zIndex = total - i;
          }

          return (
            <div
              key={album.id || `album-${i}`}
              onClick={() => {
                if (i === safeIndex) onSelect(album);
                else onChange(i);
              }}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '48px',
                width: `${imgSize}px`,
                height: `${imgSize}px`,
                zIndex,
                filter,
                transform: `translateX(calc(-50% + ${xOffset}px)) rotateY(${degree}deg) translateZ(${z}px)`,
                transition: 'transform 0.3s ease-out, filter 0.3s ease-out',
                cursor: 'pointer',
                WebkitBoxReflect: 'below 0px -webkit-gradient(linear, left top, left bottom, from(transparent), color-stop(35%, transparent), to(rgba(0, 0, 0, 0.4)))'
              }}
            >
              <img
                src={album.cover || generateEInkArt(album.title, album.artist, album.year, isCenter)}
                alt={album.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: isCenter
                    ? 'none'
                    : einkSubMode === '1bit'
                    ? 'grayscale(100%) contrast(240%) brightness(88%)'
                    : einkSubMode === '4gray'
                    ? 'grayscale(100%) contrast(180%) brightness(92%)'
                    : 'grayscale(100%) contrast(165%) brightness(90%)',
                  border: isCenter ? '2px solid #F36F21' : '1px solid #444444',
                  boxShadow: isCenter ? '0 12px 30px rgba(243, 111, 33, 0.35), 0 6px 18px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'filter 0.3s ease-out, border 0.3s ease-out, box-shadow 0.3s ease-out'
                }}
              />

              {/* Selection Ring for Center Card */}
              {isCenter && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    right: '-3px',
                    bottom: '-3px',
                    border: '2px solid #F36F21',
                    pointerEvents: 'none'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Metadata Readout Below Active Center Album */}
      {currentAlbum && (
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            marginTop: '18px',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#1A1A1A', letterSpacing: '0.04em' }}>
            {currentAlbum.title.toUpperCase()}
          </div>
          <div style={{ fontWeight: 500, fontSize: '11px', color: '#444444' }}>
            {currentAlbum.artist}
          </div>
          <div style={{ fontWeight: 400, fontSize: '9px', color: '#777777' }}>
            {currentAlbum.year || 2006}   •   {currentAlbum.genre || 'Country'}   •   {currentAlbum.tracks?.length || 14} Tracks
          </div>
        </div>
      )}

      {/* Compressed Dot Position Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: '#666666',
          letterSpacing: '0.15em'
        }}
      >
        {albums.map((_, idx) => (idx === safeIndex ? '●' : '•')).join(' ')}
      </div>
    </div>
  );
};
