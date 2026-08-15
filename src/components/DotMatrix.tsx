import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../types/music';

interface DotMatrixProps {
  mode: 'speaker' | 'text' | 'art' | 'menu' | 'lyrics';
  textTitle?: string;
  textSub?: string;
  artUrl?: string;
  currentTrack?: Track;
  menuItems?: string[];
  menuTracks?: Track[];
  selectedIndex?: number;
  isPlaying?: boolean;
  progressPercent?: number; // 0 - 100
  duration?: number;
  einkSubMode?: '1bit' | '4gray' | 'grayscale' | 'standard';
  columns?: number;
  rows?: number;
  width?: number;
  height?: number;
  onSelectMenuItem?: (index: number) => void;
  onMenuScroll?: (delta: number) => void;
}

export const DotMatrix: React.FC<DotMatrixProps> = ({
  mode,
  textTitle = '',
  textSub = '',
  artUrl,
  currentTrack,
  menuItems = [],
  menuTracks = [],
  selectedIndex = 0,
  isPlaying = false,
  progressPercent = 0,
  duration = 0,
  einkSubMode = 'standard',
  columns = 28,
  rows = 34,
  width = 380,
  height = 320,
  onSelectMenuItem,
  onMenuScroll
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const einkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentArtUrlRef = useRef<string | undefined>(undefined);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const loadedTrackImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Drag & Touch Sliding State for CoverFlow
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragOffsetXRef = useRef<number>(0);
  const [dragOffsetState, setDragOffsetState] = useState<number>(0);

  // Cache artwork images for album Cover Flow
  useEffect(() => {
    if (menuTracks && menuTracks.length > 0) {
      menuTracks.forEach(t => {
        if (t.cover && !loadedTrackImagesRef.current.has(t.cover)) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            loadedTrackImagesRef.current.set(t.cover!, img);
          };
          img.src = t.cover;
        }
      });
    }
  }, [menuTracks]);

  // Continuous E-Ink Album Art Processor for Art Mode
  useEffect(() => {
    if (!artUrl) {
      currentArtUrlRef.current = undefined;
      setIsImageLoaded(false);
      return;
    }

    if (currentArtUrlRef.current === artUrl && einkCanvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = width;
      renderCanvas.height = height;
      const renderCtx = renderCanvas.getContext('2d');
      if (!renderCtx) return;

      // Fill background first (letterbox bars will show eink paper color)
      renderCtx.fillStyle = '#EEEEEE';
      renderCtx.fillRect(0, 0, width, height);

      // Use object-fit:contain — scale to fit without stretching
      const scale = Math.min(width / img.width, height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (width - w) / 2;
      const y = (height - h) / 2;

      renderCtx.drawImage(img, x, y, w, h);

      const imgData = renderCtx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (einkSubMode === '1bit') {
          const v = lum > 128 ? 255 : 0;
          data[i] = v; data[i + 1] = v; data[i + 2] = v;
        } else if (einkSubMode === '4gray') {
          let v = 255;
          if (lum < 64) v = 32;
          else if (lum < 128) v = 96;
          else if (lum < 192) v = 176;
          data[i] = v; data[i + 1] = v; data[i + 2] = v;
        } else {
          // Warm E-Ink Monochromatic Dithered Artwork
          const contrast = 1.35;
          const cLum = Math.max(0, Math.min(255, (lum - 128) * contrast + 128));
          data[i] = Math.round((cLum / 255) * 235);
          data[i + 1] = Math.round((cLum / 255) * 231);
          data[i + 2] = Math.round((cLum / 255) * 222);
        }
      }

      renderCtx.putImageData(imgData, 0, 0);
      einkCanvasRef.current = renderCanvas;
      currentArtUrlRef.current = artUrl;
      setIsImageLoaded(true);
    };
    img.src = artUrl;
  }, [artUrl, einkSubMode, width, height]);

  // Check if active menu selection is inside a folder / song list or settings
  const isSelectedSystemOrTrack = () => {
    if (menuItems.length === 0) return true;
    const firstItem = menuItems[0] || '';
    if (firstItem.startsWith('◄')) return true; // All sub-menus (settings, folders, lists) render as text

    const currentItem = menuItems[selectedIndex] || '';
    return (
      currentItem.startsWith('◄') ||
      currentItem.includes('EQ PRESET') ||
      currentItem.includes('OUTPUT MODE') ||
      currentItem.includes('DIRECT OUTPUT') ||
      currentItem.includes('REPLAYGAIN') ||
      currentItem.includes('CROSSFADE') ||
      currentItem.includes('TAPE WARMTH') ||
      currentItem.includes('SPATIAL AUDIO') ||
      currentItem.includes(' - ')
    );
  };

  // Click handler for Menu selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'menu' || !onSelectMenuItem || menuItems.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (isSelectedSystemOrTrack()) {
      // Text-Only E-Ink List Row Click
      const visibleCount = 7;
      const startIdx = Math.max(0, Math.min(selectedIndex - 3, menuItems.length - visibleCount));
      const clickedRow = Math.floor((clickY - 20) / 38);
      const targetIdx = startIdx + clickedRow;

      if (targetIdx >= 0 && targetIdx < menuItems.length) {
        onSelectMenuItem(targetIdx);
      }
    } else {
      // Cover Flow Horizontal Carousel Click
      const systemCount = Math.min(3, menuItems.length);

      if (clickY < 120) {
        // Clicked Top System Text Menu Section
        const clickedRow = Math.floor((clickY - 10) / 34);
        if (clickedRow >= 0 && clickedRow < systemCount) {
          onSelectMenuItem(clickedRow);
        }
      } else {
        // Clicked Bottom 3D Cover Flow Section
        const cx = width / 2;
        if (clickX >= cx - 65 && clickX <= cx + 65) {
          // Center album clicked -> select active album
          onSelectMenuItem(selectedIndex);
        } else if (clickX < cx - 65) {
          // Left side clicked -> move to previous album
          if (selectedIndex > systemCount) {
            onSelectMenuItem(selectedIndex - 1);
          }
        } else {
          // Right side clicked -> move to next album
          if (selectedIndex < menuItems.length - 1) {
            onSelectMenuItem(selectedIndex + 1);
          }
        }
      }
    }
  };

  // Mouse Drag Slidable Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'menu') return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragOffsetXRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || mode !== 'menu') return;
    const deltaX = e.clientX - dragStartXRef.current;
    dragOffsetXRef.current = deltaX;
    setDragOffsetState(deltaX);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const deltaX = dragOffsetXRef.current;

    const threshold = 30; // 30px drag threshold to step carousel
    const systemCount = Math.min(3, menuItems.length);

    if (deltaX < -threshold) {
      // Swiped Left -> Move to Next Album
      if (onSelectMenuItem && selectedIndex < menuItems.length - 1) {
        const nextIdx = selectedIndex < systemCount ? systemCount : selectedIndex + 1;
        onSelectMenuItem(nextIdx);
      }
    } else if (deltaX > threshold) {
      // Swiped Right -> Move to Previous Album
      if (onSelectMenuItem && selectedIndex > systemCount) {
        onSelectMenuItem(selectedIndex - 1);
      }
    } else if (Math.abs(deltaX) < 5) {
      handleCanvasClick(e);
    }

    dragOffsetXRef.current = 0;
    setDragOffsetState(0);
  };

  // Touch Support for Mobile / Touch Devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'menu' || e.touches.length === 0) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.touches[0].clientX;
    dragOffsetXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || mode !== 'menu' || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - dragStartXRef.current;
    dragOffsetXRef.current = deltaX;
    setDragOffsetState(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const deltaX = dragOffsetXRef.current;
    const threshold = 30;
    const systemCount = Math.min(3, menuItems.length);

    if (deltaX < -threshold) {
      if (onSelectMenuItem && selectedIndex < menuItems.length - 1) {
        const nextIdx = selectedIndex < systemCount ? systemCount : selectedIndex + 1;
        onSelectMenuItem(nextIdx);
      }
    } else if (deltaX > threshold) {
      if (onSelectMenuItem && selectedIndex > systemCount) {
        onSelectMenuItem(selectedIndex - 1);
      }
    }

    dragOffsetXRef.current = 0;
    setDragOffsetState(0);
  };

  const canvasWheelAccumulatorRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeCanvasWheel = (e: WheelEvent) => {
      if (mode === 'menu' && onMenuScroll) {
        e.preventDefault();
        e.stopPropagation();

        const rawDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        canvasWheelAccumulatorRef.current += rawDelta;

        const threshold = 14;
        if (Math.abs(canvasWheelAccumulatorRef.current) >= threshold) {
          const steps = Math.trunc(canvasWheelAccumulatorRef.current / threshold);
          canvasWheelAccumulatorRef.current %= threshold;
          const dir = steps > 0 ? 1 : -1;
          onMenuScroll(dir);
        }
      }
    };

    canvas.addEventListener('wheel', handleNativeCanvasWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleNativeCanvasWheel);
    };
  }, [mode, onMenuScroll]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const startTime = performance.now();

    // ── iPod Classic display helpers ──────────────────────────────────────
    const IPOD_BG       = '#E8E8E8';       // LCD off-white
    const IPOD_BAR_FROM = '#F88030';       // title bar gradient start (orange)
    const IPOD_BAR_TO   = '#D45A10';       // title bar gradient end (dark orange)
    const IPOD_SEL_FROM = '#F36F21';       // selected row highlight (orange)
    const IPOD_SEL_TO   = '#C4550E';       // selected row bottom (deep orange)
    const IPOD_TEXT     = '#000000';
    const IPOD_DIM      = '#555555';
    const IPOD_SCROLL   = '#F36F21';
    const BAR_H         = 22;              // title bar height
    const ROW_H         = 27;             // list row height

    const drawTitleBar = (label: string) => {
      const grad = ctx.createLinearGradient(0, 0, 0, BAR_H);
      grad.addColorStop(0, IPOD_BAR_FROM);
      grad.addColorStop(1, IPOD_BAR_TO);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, BAR_H);
      ctx.font = 'bold 12px -apple-system, "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label.toUpperCase(), width / 2, BAR_H / 2);
      ctx.textBaseline = 'alphabetic';
    };

    const drawRow = (text: string, y: number, isSelected: boolean, hasArrow = true) => {
      if (isSelected) {
        const grad = ctx.createLinearGradient(0, y, 0, y + ROW_H);
        grad.addColorStop(0, IPOD_SEL_FROM);
        grad.addColorStop(1, IPOD_SEL_TO);
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, width, ROW_H);
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = IPOD_TEXT;
      }
      ctx.font = '12px -apple-system, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'left';
      const maxW = hasArrow ? width - 36 : width - 14;
      let display = text;
      while (ctx.measureText(display).width > maxW && display.length > 1) {
        display = display.slice(0, -1);
      }
      if (display !== text) display = display.slice(0, -1) + '…';
      ctx.fillText(display, 10, y + ROW_H / 2 + 4);
      if (hasArrow) {
        ctx.font = '10px -apple-system, Arial, sans-serif';
        ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.7)' : '#AAAAAA';
        ctx.textAlign = 'right';
        ctx.fillText('›', width - 8, y + ROW_H / 2 + 4);
      }
      // Row divider
      ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(10, y + ROW_H);
      ctx.lineTo(width - 10, y + ROW_H);
      ctx.stroke();
    };

    const drawScrollbar = (_startIdx: number, _visibleCount: number, _total: number) => {
      // Scrollbar removed per user request
    };

    const formatTime = (secs: number) => {
      if (!secs || isNaN(secs)) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;

      // Base LCD background
      ctx.fillStyle = IPOD_BG;
      ctx.fillRect(0, 0, width, height);

      // ── MENU MODE ─────────────────────────────────────────────────────────
      if (mode === 'menu' && menuItems.length > 0) {
        const isInsideFolder = (() => {
          if (menuItems.length === 0) return false;
          return menuItems[0].startsWith('◄') || menuItems[0].includes('BACK');
        })();

        if (isInsideFolder) {
          // ── iPod-style scrollable list (folders / settings / tracks) ──
          const title = menuItems[0].replace('◄', '').replace('BACK TO MAIN MENU', '').trim() || 'Menu';
          drawTitleBar(title || menuItems[0]);

          const visibleCount = Math.floor((height - BAR_H) / ROW_H);
          const startIdx = Math.max(0, Math.min(selectedIndex - Math.floor(visibleCount / 2), menuItems.length - visibleCount));
          const endIdx = Math.min(menuItems.length, startIdx + visibleCount);

          for (let i = startIdx; i < endIdx; i++) {
            const isSelected = i === selectedIndex;
            const raw = menuItems[i];
            const y = BAR_H + (i - startIdx) * ROW_H;

            // Extract [STATE] badge value from brackets
            const bracketMatch = raw.match(/\[([^\]]+)\]/);
            const badgeText = bracketMatch ? bracketMatch[1].replace('✓', '').trim() : null;

            // Determine if this is a checkmark-only active indicator (EQ presets)
            const isCheckActive = raw.includes('✓') && !bracketMatch;

            // Clean label: remove prefix symbols, bracket content, checkmarks
            const label = raw
              .replace(/^◄\s*/, '')
              .replace(/^\d+\.\s*/, '')
              .replace(/^[⚙+►•◎]\s*/, '')
              .replace(/\[.*?\]/g, '')
              .replace(/✓/g, '')
              .trim();

            // Draw row background
            if (isSelected) {
              const grad = ctx.createLinearGradient(0, y, 0, y + ROW_H);
              grad.addColorStop(0, IPOD_SEL_FROM);
              grad.addColorStop(1, IPOD_SEL_TO);
              ctx.fillStyle = grad;
              ctx.fillRect(0, y, width, ROW_H);
            }

            // Row divider
            ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(10, y + ROW_H);
            ctx.lineTo(width - 10, y + ROW_H);
            ctx.stroke();

            // Badge rendering
            const BADGE_PAD_X = 6;
            const BADGE_H = 14;
            const BADGE_Y = y + (ROW_H - BADGE_H) / 2;
            let badgeW = 0;

            if (badgeText && i !== 0) {
              ctx.font = 'bold 9px -apple-system, Arial, sans-serif';
              const badgeMeasure = ctx.measureText(badgeText).width + BADGE_PAD_X * 2;
              badgeW = Math.max(30, badgeMeasure);
              const badgeX = width - badgeW - 8;

              // Badge color based on state
              const isEnabled = /ENABLED|ON|EXCLUSIVE|TRACK|ALBUM/.test(badgeText);
              const isDisabled = /DISABLED|OFF|BYPASS/.test(badgeText);
              const isNumeric = /\d+ SEC/.test(badgeText);

              let badgeColor = '#AAAAAA'; // default grey
              if (isEnabled) badgeColor = '#3A9A3A';
              else if (isNumeric) badgeColor = IPOD_BAR_FROM;
              else if (isDisabled) badgeColor = '#999999';
              if (isSelected) badgeColor = 'rgba(255,255,255,0.25)';

              // Draw pill badge
              ctx.fillStyle = badgeColor;
              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(badgeX, BADGE_Y, badgeW, BADGE_H, BADGE_H / 2);
              else ctx.fillRect(badgeX, BADGE_Y, badgeW, BADGE_H);
              ctx.fill();

              ctx.fillStyle = isSelected ? '#FFFFFF' : '#FFFFFF';
              ctx.textAlign = 'center';
              ctx.fillText(badgeText, badgeX + badgeW / 2, BADGE_Y + BADGE_H / 2 + 3);
            }

            // Active checkmark dot for EQ presets (no bracket, just ✓)
            if (isCheckActive && i !== 0) {
              const dotX = width - 16;
              const dotY = y + ROW_H / 2;
              ctx.fillStyle = isSelected ? '#FFFFFF' : '#3A9A3A';
              ctx.beginPath();
              ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
              ctx.fill();
              badgeW = 20;
            }

            // Label text
            ctx.font = '12px -apple-system, "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = i === 0
              ? (isSelected ? '#FFFFFF' : IPOD_DIM)
              : (isSelected ? '#FFFFFF' : IPOD_TEXT);
            const maxLabelW = width - 14 - (badgeW > 0 ? badgeW + 12 : 16);
            let labelDisplay = label;
            while (ctx.measureText(labelDisplay).width > maxLabelW && labelDisplay.length > 1) {
              labelDisplay = labelDisplay.slice(0, -1);
            }
            if (labelDisplay !== label) labelDisplay = labelDisplay.slice(0, -1) + '…';
            ctx.fillText(labelDisplay, 10, y + ROW_H / 2 + 4);
          }

          drawScrollbar(startIdx, visibleCount, menuItems.length);


        } else {
          // ── Main menu: iPod-style album list with cover art side-by-side ──
          const systemCount = Math.min(3, menuItems.length);
          const isSystemSelected = selectedIndex < systemCount;

          // Title bar: show selected section name
          const titleLabel = isSystemSelected
            ? menuItems[selectedIndex]?.replace(/[+⚙►•]/g, '').replace(/\[.*?\]/g, '').trim().slice(0, 28) || 'Menu'
            : 'Music';
          drawTitleBar(titleLabel);

          // System rows at top
          for (let i = 0; i < systemCount; i++) {
            const isSelected = isSystemSelected && i === selectedIndex;
            const rawText = menuItems[i].replace(/[+⚙►•]/g, '').replace(/\[.*?\]/g, '').trim();
            drawRow(rawText, BAR_H + i * ROW_H, isSelected);
          }

          // Divider between system rows and album art
          const divY = BAR_H + systemCount * ROW_H + 4;
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, divY);
          ctx.lineTo(width, divY);
          ctx.stroke();

          // Album cover flow area
          const carouselTop = divY + 6;
          const carouselH = height - carouselTop - 8;
          const albumItems = menuItems.slice(systemCount);
          const totalAlbums = albumItems.length > 0 ? albumItems.length : (menuTracks?.length || 0);

          const activeAlbumIdx = isSystemSelected
            ? 0
            : Math.max(0, Math.min(selectedIndex - systemCount, Math.max(0, totalAlbums - 1)));

          if (totalAlbums > 0) {
            // Cover art panel (left side square)
            const artSize = Math.min(carouselH - 4, 90);
            const artX = 12;
            const artY = carouselTop + (carouselH - artSize) / 2;

            const trackMatch = menuTracks && menuTracks.length > activeAlbumIdx ? menuTracks[activeAlbumIdx] : null;
            const coverImg = trackMatch?.cover ? loadedTrackImagesRef.current.get(trackMatch.cover) : null;

            ctx.fillStyle = '#CCCCCC';
            ctx.fillRect(artX, artY, artSize, artSize);

            if (coverImg) {
              ctx.drawImage(coverImg, artX, artY, artSize, artSize);
            } else {
              ctx.fillStyle = '#BBBBBB';
              ctx.fillRect(artX, artY, artSize, artSize);
              ctx.font = '28px Arial';
              ctx.fillStyle = '#999999';
              ctx.textAlign = 'center';
              ctx.fillText('♪', artX + artSize / 2, artY + artSize / 2 + 10);
            }

            // Border around art
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(artX, artY, artSize, artSize);

            // Album info (right side)
            const infoX = artX + artSize + 10;
            const infoW = width - infoX - 8;
            const rawAlbum = albumItems[activeAlbumIdx] || (trackMatch ? (trackMatch.album || trackMatch.title) : '');
            const cleanAlbum = rawAlbum.replace(/\s*-\s*.*/, '').replace(/\[.*?\]/g, '').trim();
            const artistName = trackMatch?.artist || '';

            ctx.font = 'bold 12px -apple-system, Arial, sans-serif';
            ctx.fillStyle = IPOD_TEXT;
            ctx.textAlign = 'left';
            let albumDisplay = cleanAlbum;
            while (ctx.measureText(albumDisplay).width > infoW && albumDisplay.length > 1) albumDisplay = albumDisplay.slice(0, -1);
            if (albumDisplay !== cleanAlbum) albumDisplay = albumDisplay.slice(0, -1) + '…';
            ctx.fillText(albumDisplay, infoX, artY + 16);

            ctx.font = '11px -apple-system, Arial, sans-serif';
            ctx.fillStyle = IPOD_DIM;
            let artistDisplay = artistName;
            while (ctx.measureText(artistDisplay).width > infoW && artistDisplay.length > 1) artistDisplay = artistDisplay.slice(0, -1);
            if (artistDisplay !== artistName) artistDisplay = artistDisplay.slice(0, -1) + '…';
            ctx.fillText(artistDisplay, infoX, artY + 34);

            ctx.font = '10px -apple-system, Arial, sans-serif';
            ctx.fillStyle = '#888888';
            ctx.fillText(`${trackMatch?.year || ''}`, infoX, artY + 50);

            // Position indicator: "3 of 12"
            ctx.font = '10px -apple-system, Arial, sans-serif';
            ctx.fillStyle = '#888888';
            ctx.textAlign = 'right';
            ctx.fillText(`${activeAlbumIdx + 1} of ${totalAlbums}`, width - 8, artY + artSize);

            // Album list rows below art
            const listTop = artY + artSize + 8;
            const albumsToShow = Math.floor((height - listTop) / ROW_H);
            for (let i = 0; i < albumsToShow && (activeAlbumIdx + i) < totalAlbums; i++) {
              const idx = activeAlbumIdx + i;
              const isSelected = !isSystemSelected && idx === activeAlbumIdx && !isSystemSelected;
              const rawName = albumItems[idx] || '';
              const cleanName = rawName.replace(/\s*-\s*.*/, '').replace(/\[.*?\]/g, '').trim();
              drawRow(cleanName, listTop + i * ROW_H, isSelected && idx === activeAlbumIdx, true);
            }
          }
        }

      // ── NOW PLAYING (text/art/speaker) ────────────────────────────────────
      } else if (mode === 'text' || mode === 'art' || mode === 'speaker') {

        // Status bar at top
        const gradNP = ctx.createLinearGradient(0, 0, 0, BAR_H);
        gradNP.addColorStop(0, IPOD_BAR_FROM);
        gradNP.addColorStop(1, IPOD_BAR_TO);
        ctx.fillStyle = gradNP;
        ctx.fillRect(0, 0, width, BAR_H);

        // Title in bar: "Now Playing"
        ctx.font = 'bold 12px -apple-system, "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Now Playing', width / 2, BAR_H / 2);

        // Play/pause indicator left
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(isPlaying ? '▶' : '⏸', 8, BAR_H / 2);

        ctx.textBaseline = 'alphabetic';

        // ── Album Art square (centered, letterboxed) ──
        const artSize = Math.min(width, height - BAR_H) * 0.70;
        const artX = (width - artSize) / 2;
        const artY = BAR_H + 8;

        ctx.fillStyle = '#D0D0D0';
        ctx.fillRect(artX, artY, artSize, artSize);

        if (mode === 'art' && isImageLoaded && einkCanvasRef.current) {
          // Draw the processed eink art but letterboxed into the square
          ctx.drawImage(einkCanvasRef.current, artX, artY, artSize, artSize);
        } else {
          // Load and draw the cover image directly (crisp, no eink processing)
          const coverImg = artUrl ? loadedTrackImagesRef.current.get(artUrl) : null;
          if (coverImg) {
            const scale = Math.min(artSize / coverImg.width, artSize / coverImg.height);
            const dw = coverImg.width * scale;
            const dh = coverImg.height * scale;
            const dx = artX + (artSize - dw) / 2;
            const dy = artY + (artSize - dh) / 2;
            ctx.fillStyle = '#C8C8C8';
            ctx.fillRect(artX, artY, artSize, artSize);
            ctx.drawImage(coverImg, dx, dy, dw, dh);
          } else {
            // Placeholder: vinyl disc look
            ctx.fillStyle = '#C8C8C8';
            ctx.fillRect(artX, artY, artSize, artSize);
            ctx.beginPath();
            ctx.arc(artX + artSize / 2, artY + artSize / 2, artSize * 0.36, 0, Math.PI * 2);
            ctx.fillStyle = '#888888';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(artX + artSize / 2, artY + artSize / 2, artSize * 0.1, 0, Math.PI * 2);
            ctx.fillStyle = '#AAAAAA';
            ctx.fill();
            ctx.font = `${artSize * 0.22}px Arial`;
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('♪', artX + artSize / 2, artY + artSize / 2 + artSize * 0.08);
          }
        }

        // Thin border around art
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(artX, artY, artSize, artSize);

        // ── Track info below art ──
        const infoY = artY + artSize + 14;

        ctx.font = 'bold 13px -apple-system, "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = IPOD_TEXT;
        ctx.textAlign = 'center';
        let titleDisplay = textTitle || (currentTrack?.title || 'Unknown Track');
        while (ctx.measureText(titleDisplay).width > width - 24 && titleDisplay.length > 1) titleDisplay = titleDisplay.slice(0, -1);
        if (titleDisplay !== (textTitle || currentTrack?.title)) titleDisplay += '…';
        ctx.fillText(titleDisplay, width / 2, infoY);

        ctx.font = '11px -apple-system, "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = IPOD_DIM;
        let artistDisplay = currentTrack?.artist || '';
        while (ctx.measureText(artistDisplay).width > width - 24 && artistDisplay.length > 1) artistDisplay = artistDisplay.slice(0, -1);
        if (artistDisplay !== currentTrack?.artist) artistDisplay += '…';
        ctx.fillText(artistDisplay, width / 2, infoY + 17);

        ctx.font = '10px -apple-system, Arial, sans-serif';
        ctx.fillStyle = '#888888';
        ctx.fillText(currentTrack?.album || '', width / 2, infoY + 31);


      // ── LYRICS MODE ───────────────────────────────────────────────────────
      } else if (mode === 'lyrics') {
        drawTitleBar('Lyrics');

        const rawLyrics = currentTrack?.lyrics || [
          `[00:05] ${currentTrack?.title || 'Playing Music'}`,
          `[00:15] ${currentTrack?.artist || 'Local Artist'}`,
          `[00:30] ${currentTrack?.album || 'Draun Audio'}`,
        ].join('\n');

        const parsedLines: { timeSec: number; text: string }[] = [];
        rawLyrics.split('\n').forEach(line => {
          const match = line.match(/\[(\d+):(\d+\.?\d*)\]/);
          if (match) {
            const timeSec = parseFloat(match[1]) * 60 + parseFloat(match[2]);
            const text = line.replace(/\[\d+:\d+\.?\d*\]/g, '').trim();
            if (text) parsedLines.push({ timeSec, text });
          } else if (line.trim()) {
            parsedLines.push({ timeSec: -1, text: line.trim() });
          }
        });

        const hasTimestamps = parsedLines.some(l => l.timeSec >= 0);
        const actualPlaybackTime = (progressPercent / 100) * (duration || 180);
        let currentLineIdx = 0;
        let displayLines: string[] = [];

        if (hasTimestamps) {
          const timedOnly = parsedLines.filter(l => l.timeSec >= 0);
          for (let i = 0; i < timedOnly.length; i++) {
            if (actualPlaybackTime >= timedOnly[i].timeSec) currentLineIdx = i;
          }
          displayLines = timedOnly.map(l => l.text);
        } else {
          displayLines = parsedLines.map(l => l.text);
          currentLineIdx = Math.floor((progressPercent / 100) * displayLines.length);
        }

        const visibleCount = Math.floor((height - BAR_H) / ROW_H);
        const startIdx = Math.max(0, Math.min(currentLineIdx - Math.floor(visibleCount / 2), displayLines.length - visibleCount));

        for (let i = startIdx; i < Math.min(displayLines.length, startIdx + visibleCount); i++) {
          const isActive = i === currentLineIdx;
          const y = BAR_H + (i - startIdx) * ROW_H;

          if (isActive) {
            const grad = ctx.createLinearGradient(0, y, 0, y + ROW_H);
            grad.addColorStop(0, IPOD_SEL_FROM);
            grad.addColorStop(1, IPOD_SEL_TO);
            ctx.fillStyle = grad;
            ctx.fillRect(0, y, width, ROW_H);
            ctx.font = 'bold 12px -apple-system, Arial, sans-serif';
            ctx.fillStyle = '#FFFFFF';
          } else {
            ctx.font = '12px -apple-system, Arial, sans-serif';
            ctx.fillStyle = i < currentLineIdx ? '#999999' : IPOD_TEXT;
          }
          ctx.textAlign = 'center';
          let lineText = displayLines[i];
          while (ctx.measureText(lineText).width > width - 20 && lineText.length > 1) lineText = lineText.slice(0, -1);
          ctx.fillText(lineText + (lineText !== displayLines[i] ? '…' : ''), width / 2, y + ROW_H / 2 + 4);

          ctx.strokeStyle = 'rgba(0,0,0,0.08)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(0, y + ROW_H);
          ctx.lineTo(width, y + ROW_H);
          ctx.stroke();
        }

        drawScrollbar(startIdx, visibleCount, displayLines.length);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, textTitle, textSub, artUrl, menuItems, menuTracks, selectedIndex, isPlaying, progressPercent, einkSubMode, columns, rows, width, height, isImageLoaded, dragOffsetState]);


  return (
    <canvas
      ref={canvasRef}
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
        display: 'block',
        borderRadius: '4px',
        backgroundColor: 'var(--surface)',
        cursor: mode === 'menu' ? 'grab' : 'default',
        touchAction: 'none'
      }}
    />
  );
};
