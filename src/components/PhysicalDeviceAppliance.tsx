import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from './ProgressBar';
import { DotMatrix } from './DotMatrix';
import { CoverFlow } from './CoverFlow';
import { RotaryDial } from './RotaryDial';
import { DotPlaybackIcon } from './DotPlaybackIcon';
import { MarqueeFadeText } from './MarqueeFadeText';
import { FolderPlus, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Image as ImageIcon, Settings } from 'lucide-react';

export const PhysicalDeviceAppliance: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    currentTime,
    duration,
    seekTo,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    nextTrack,
    previousTrack,
    tracks,
    albums,
    folders,
    history: historyTracks,
    eqPreset,
    tapeWarmth,
    spatial3d,
    audioStatus,
    setEqPreset,
    toggleTapeWarmth,
    toggleSpatial3d,
    toggleDirectOutput,
    toggleOutputMode,
    toggleReplayGain,
    playTrack,
    settings,
    setDisplayMode,
    setArtMode,
    toggleShuffle,
    toggleRepeat,
    setCrossfade,
    importLocalFiles
  } = usePlayer();

  // Internal Appliance State Mode - Default to Cover Flow Menu Mode
  const [matrixMode, setMatrixMode] = useState<'speaker' | 'text' | 'art' | 'menu' | 'lyrics'>('menu');
  const [menuIndex, setMenuIndex] = useState<number>(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [showVolumeHud, setShowVolumeHud] = useState<boolean>(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState<boolean>(false);
  // Show IMPORT & SETTINGS only after pressing MENU button
  const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);

  const toggleMiniPlayer = () => {
    setIsMiniPlayer(prev => {
      const nextState = !prev;
      const win = window as any;
      if (win.electronAPI && win.electronAPI.setMiniPlayer) {
        win.electronAPI.setMiniPlayer(nextState);
      } else if (win.ipcRenderer) {
        win.ipcRenderer.send('set-mini-player', nextState);
      } else if (window.require) {
        try {
          const { ipcRenderer } = window.require('electron');
          ipcRenderer.send('set-mini-player', nextState);
        } catch (e) {}
      }
      return nextState;
    });
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  const volumeHudTimerRef = useRef<number | null>(null);

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isArtOn = settings.artMode === 'on';
  const einkSubMode = settings.displayMode === 'eink' ? settings.einkSubMode : 'standard';

  const isDspSelected = selectedFolderId === 'dsp';
  const isHistorySelected = selectedFolderId === 'history';
  const selectedAlbumFolder = selectedFolderId && selectedFolderId.startsWith('album-')
    ? albums.find(a => `album-${a.id}` === selectedFolderId || `album-${a.title}` === selectedFolderId || a.id === selectedFolderId.replace('album-', ''))
    : null;

  const selectedFolder = isDspSelected
    ? { id: 'dsp', folderName: '⚙ SETTINGS', tracks: [] }
    : isHistorySelected
    ? { id: 'history', folderName: 'RECENTS / PLAY HISTORY', tracks: historyTracks }
    : selectedAlbumFolder
    ? { id: selectedFolderId!, folderName: `ALBUM: ${selectedAlbumFolder.title.toUpperCase()}`, tracks: selectedAlbumFolder.tracks }
    : folders.find(f => f.id === selectedFolderId) || null;

  const currentMenuItems = selectedFolder === null
    ? [
        ...(isMenuExpanded ? [
          '+ IMPORT MUSIC FOLDER',
          `⚙ SETTINGS (${audioStatus?.directOutput ? 'DIRECT' : audioStatus?.outputMode || 'WASAPI'})`,
        ] : []),
        `MUSIC LIBRARY [${tracks.length} TRACKS]`,
        ...albums.map(a => `${a.title.toUpperCase()} - ${a.artist.toUpperCase()}`)
      ]
    : isDspSelected
    ? [
        '◄ BACK TO MAIN MENU',
        `DIRECT OUTPUT: [${audioStatus?.directOutput ? 'ON' : 'OFF'}]`,
        `AUDIO OUTPUT MODE: [${audioStatus?.directOutput ? 'EXCLUSIVE' : (audioStatus?.outputMode === 'WASAPI Exclusive' ? 'EXCLUSIVE' : 'SHARED')}]`,
        `REPLAYGAIN MODE: [${audioStatus?.replayGain || 'OFF'}]`,
        `GAPLESS CROSSFADE: [${settings.crossfade > 0 ? `${settings.crossfade}s` : 'OFF'}]`,
        `EQ PRESET: WARM ANALOG ${eqPreset === 'warm-analog' ? '✓' : ''}`,
        `EQ PRESET: BASS BOOST ${eqPreset === 'bass-boost' ? '✓' : ''}`,
        `EQ PRESET: VOCAL CLARITY ${eqPreset === 'vocal-clarity' ? '✓' : ''}`,
        `EQ PRESET: E-INK PURE ${eqPreset === 'eink-pure' ? '✓' : ''}`,
        `EQ PRESET: FLAT ${eqPreset === 'flat' ? '✓' : ''}`,
        `ANALOG TAPE WARMTH: [${tapeWarmth ? 'ON' : 'OFF'}]`,
        `BINAURAL 3D SPATIAL: [${spatial3d ? 'ON' : 'OFF'}]`
      ]
    : ['◄ BACK TO MAIN MENU', ...selectedFolder.tracks.map((t, idx) => `${idx + 1}. ${t.title} - ${t.artist}`)];

  // Drag & Drop handlers for local music files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      importLocalFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      importLocalFiles(e.target.files);
    }
  };

  // Toggle Matrix mode on display tap: press once to switch directly to lyrics mode, press again to cycle
  const cycleMatrixMode = () => {
    if (matrixMode === 'menu') setMatrixMode('lyrics');
    else if (matrixMode === 'lyrics') setMatrixMode(isArtOn ? 'art' : 'text');
    else if (matrixMode === 'art') setMatrixMode('text');
    else if (matrixMode === 'text') setMatrixMode('speaker');
    else setMatrixMode('menu');
  };

  const handleMenuSelect = (index: number) => {
    if (selectedFolder === null) {
      // Level 1: System Actions & Album CoverFlow Selection
      if (isMenuExpanded) {
        // IMPORT (index 0), SETTINGS (index 1), MUSIC LIBRARY (index 2), albums start at index 3
        if (index === 0) {
          fileInputRef.current?.click();
        } else if (index === 1) {
          setSelectedFolderId('dsp');
          setMenuIndex(0);
        } else {
          // index 2 = Music Library (just a label, no action), index 3+ = albums
          const albumIdx = index - 3;
          if (albumIdx >= 0 && albumIdx < albums.length) {
            const selectedAlbum = albums[albumIdx];
            if (selectedAlbum) {
              setSelectedFolderId(`album-${selectedAlbum.id}`);
              setMenuIndex(0);
            }
          }
        }
      } else {
        // Not expanded: MUSIC LIBRARY (index 0, label only), albums start at index 1
        const albumIdx = index - 1;
        if (albumIdx >= 0 && albumIdx < albums.length) {
          const selectedAlbum = albums[albumIdx];
          if (selectedAlbum) {
            setSelectedFolderId(`album-${selectedAlbum.id}`);
            setMenuIndex(0);
          }
        }
      }
    } else if (isDspSelected) {
      if (index === 0) {
        setSelectedFolderId(null);
        setMenuIndex(0);
      } else if (index === 1) toggleDirectOutput();
      else if (index === 2) toggleOutputMode();
      else if (index === 3) toggleReplayGain();
      else if (index === 4) {
        const nextCross = settings.crossfade === 0 ? 3 : settings.crossfade === 3 ? 6 : settings.crossfade === 6 ? 10 : 0;
        setCrossfade(nextCross);
      }
      else if (index === 5) setEqPreset('warm-analog');
      else if (index === 6) setEqPreset('bass-boost');
      else if (index === 7) setEqPreset('vocal-clarity');
      else if (index === 8) setEqPreset('eink-pure');
      else if (index === 9) setEqPreset('flat');
      else if (index === 10) toggleTapeWarmth();
      else if (index === 11) toggleSpatial3d();
    } else {
      // Level 2: Songs Inside Selected Folder, Album, or History Catalog
      if (index === 0) {
        setSelectedFolderId(null);
        setMenuIndex(0);
      } else {
        const songIdx = index - 1;
        if (songIdx >= 0 && songIdx < selectedFolder.tracks.length) {
          playTrack(selectedFolder.tracks[songIdx], selectedFolder.tracks);
        }
      }
    }
  };

  const handleAppClose = () => {
    const win = window as any;
    if (win.electronAPI && win.electronAPI.closeWindow) {
      win.electronAPI.closeWindow();
    } else if (win.ipcRenderer) {
      win.ipcRenderer.send('window-close');
    } else if (window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('window-close');
      } catch (e) {
        window.close();
      }
    } else {
      window.close();
    }
  };

  const topLeftTimerRef = useRef<number | null>(null);
  const isTopLeftLongPressRef = useRef<boolean>(false);

  const handleTopLeftMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isTopLeftLongPressRef.current = false;
    if (topLeftTimerRef.current) clearTimeout(topLeftTimerRef.current);

    topLeftTimerRef.current = window.setTimeout(() => {
      isTopLeftLongPressRef.current = true;
      handleAppClose();
    }, 600);
  };

  const handleTopLeftMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (topLeftTimerRef.current) {
      clearTimeout(topLeftTimerRef.current);
      topLeftTimerRef.current = null;
    }
    if (!isTopLeftLongPressRef.current) {
      togglePlayPause();
    }
  };

  const handleTopLeftMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (topLeftTimerRef.current) {
      clearTimeout(topLeftTimerRef.current);
      topLeftTimerRef.current = null;
    }
    isTopLeftLongPressRef.current = false;
  };

  const handleMenuScroll = (delta: number) => {
    const maxLen = currentMenuItems.length;
    setMenuIndex(prev => Math.max(0, Math.min(maxLen - 1, prev + delta)));
  };

  const handleDialChange = (val: number) => {
    if (matrixMode === 'menu') {
      const maxLen = currentMenuItems.length;
      const idx = Math.max(0, Math.min(maxLen - 1, Math.floor((val / 100) * maxLen)));
      setMenuIndex(idx);
    } else {
      setVolume(val);
      setShowVolumeHud(true);
      if (volumeHudTimerRef.current) clearTimeout(volumeHudTimerRef.current);
      volumeHudTimerRef.current = window.setTimeout(() => {
        setShowVolumeHud(false);
      }, 1200);
    }
  };

  const handleDialConfirm = () => {
    if (matrixMode === 'menu') {
      handleMenuSelect(menuIndex);
    } else {
      togglePlayPause();
    }
  };

  const [isAppOpening, setIsAppOpening] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppOpening(false);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--app-bg)',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input for Music Folder Picker */}
      <input
        ref={fileInputRef}
        type="file"
        {...({ webkitdirectory: "", directory: "" } as any)}
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Drag Over Visual Overlay */}
      {isDraggingOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(243, 111, 33, 0.85)',
            color: '#FFFFFF',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            fontWeight: 700
          }}
        >
          <FolderPlus size={48} />
          <div>DROP MUSIC FOLDER TO IMPORT</div>
        </div>
      )}

      {/* DEVICE CASING (Flush width spanning edge-to-edge with macOS spring open transition) */}
      <div
        style={{
          width: '100%',
          height: '100vh',
          maxHeight: '100vh',
          backgroundColor: 'var(--device-bg)',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          borderTop: 'none',
          boxShadow: 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transform: isAppOpening ? 'scale(0.92) translateY(14px)' : 'scale(1) translateY(0)',
          opacity: isAppOpening ? 0.2 : 1,
          transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease-out',
          willChange: 'transform, opacity'
        }}
      >
        {/* TOP SECTION (~14% Height) - Native Frameless Window Drag Handle */}
        <div
          style={{
            height: '84px',
            borderBottom: '1px solid var(--device-border)',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--device-bg)',
            ...({ WebkitAppRegion: 'drag' } as React.CSSProperties)
          }}
        >
          {/* Top-Left Power Status Control Button */}
          <div
            style={{
              width: '84px',
              height: '100%',
              borderRight: '1px solid var(--device-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <button
              onMouseDown={handleTopLeftMouseDown}
              onMouseUp={handleTopLeftMouseUp}
              onMouseLeave={handleTopLeftMouseLeave}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#F0EFEB',
                border: '1px solid #D5D3CD',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.9), 0 3px 6px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                ...({ WebkitAppRegion: 'no-drag' } as React.CSSProperties)
              }}
              title="Short Press = Play/Pause, Long Press (600ms) = Close Application"
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: isMuted ? '#808080' : 'var(--accent)',
                  boxShadow: isPlaying && !isMuted ? '0 0 8px rgba(243, 111, 33, 0.8)' : 'none'
                }}
              />
            </button>
          </div>

          {/* Top Mini Player Collapse/Expand Toggle Button */}
          <button
            onClick={toggleMiniPlayer}
            style={{
              height: '100%',
              padding: '0 12px',
              borderRight: '1px solid var(--device-border)',
              borderLeft: 'none',
              borderTop: 'none',
              borderBottom: 'none',
              backgroundColor: isMiniPlayer ? '#242424' : 'transparent',
              color: isMiniPlayer ? '#EEEEEE' : 'var(--dark-content)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '10px',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              ...({ WebkitAppRegion: 'no-drag' } as React.CSSProperties)
            }}
            title={isMiniPlayer ? "Expand Full Album Art & Appliance" : "Collapse Album Art (Mini Player Mode)"}
          >
            {isMiniPlayer ? 'EXPAND' : 'MINI'}
          </button>

          {/* Top-Right Contextual Dot-Matrix Display */}
          <div
            onClick={cycleMatrixMode}
            style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              height: '100%',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px',
              backgroundColor: 'var(--surface-2)',
              fontFamily: 'var(--font-dot)',
              cursor: 'pointer'
            }}
            title="Click display to switch views (Lyrics / Art / Text / Speaker / Menu)"
          >
            {showVolumeHud ? (
              <>
                <MarqueeFadeText
                  text={`VOLUME: ${Math.round(volume)}%`}
                  style={{
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    color: '#F36F21',
                    fontWeight: 700
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  <span>LEVEL</span>
                  <span>[{'█'.repeat(Math.round(volume / 10))}${'░'.repeat(10 - Math.round(volume / 10))}]</span>
                </div>
              </>
            ) : (
              <>
                <MarqueeFadeText
                  text={currentTrack ? currentTrack.title.toUpperCase() : 'DRAUN READY'}
                  isPlaying={isPlaying}
                  bgColor="var(--surface-2)"
                  style={{
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    color: 'var(--text)',
                    fontWeight: 700
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                  <span>{audioStatus?.directOutput ? 'DIRECT 24/96' : `${audioStatus?.codec || 'FLAC'} ${audioStatus?.bitDepth || 16}/${Math.round((audioStatus?.sampleRate || 44100) / 1000)}K`}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CENTRAL COLLAPSIBLE ALBUM ART & DOT MATRIX FIELD (COLLAPSES IN MINI PLAYER MODE) */}
        <div
          onClick={cycleMatrixMode}
          style={{
            flex: isMiniPlayer ? '0 0 0px' : 1,
            height: isMiniPlayer ? '0px' : 'auto',
            maxHeight: isMiniPlayer ? '0px' : '360px',
            opacity: isMiniPlayer ? 0 : 1,
            overflow: 'hidden',
            padding: 0,
            backgroundColor: 'var(--device-bg)',
            borderBottom: isMiniPlayer ? 'none' : '1px solid var(--device-border)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          title="Click dot matrix screen to cycle modes (Speaker, Text, Art, Menu)"
        >
          {/* User Reference Braun E-Ink Control Header — only shown when MENU is pressed */}
          {isMenuExpanded && (
            <div
              style={{
                backgroundColor: einkSubMode === '1bit' ? '#FFFFFF' : '#EBE7DE',
                padding: '10px 16px 8px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                zIndex: 10,
                userSelect: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.08)'
              }}
            >
              {/* Dark Charcoal Pill Import Button */}
              <button
                className="import-pill-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1E1E1E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}
                title="Click to import local music folder"
              >
                <span style={{ fontSize: '11px' }}>► •</span>
                <span>IMPORT MUSIC FOLDER</span>
              </button>

              {/* Sub-Text Settings Readout Row */}
              <div
                className="settings-readout-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFolderId(selectedFolderId === 'dsp' ? null : 'dsp');
                  setMenuIndex(0);
                }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#1A1A1A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  paddingTop: '2px'
                }}
                title="Click to toggle WASAPI, EQ Presets and Analog Tape Warmth settings"
              >
                <span>
                  SETTINGS (EQ: {(eqPreset || 'WARM-ANALOG').toUpperCase()}) | TAPE: {tapeWarmth ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          )}

          {/* Main Display Area */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {matrixMode === 'menu' && selectedFolderId === null ? (
              <CoverFlow
                albums={albums}
                activeIndex={menuIndex >= 3 ? menuIndex - 3 : 0}
                onChange={(newIdx) => setMenuIndex(newIdx + 3)}
                onSelect={(album) => {
                  if (album) {
                    setSelectedFolderId(`album-${album.id}`);
                    setMenuIndex(0);
                  }
                }}
                einkSubMode={einkSubMode}
              />
            ) : (
              <DotMatrix
                mode={matrixMode}
                textTitle={currentTrack ? currentTrack.title : 'DRAUN SYSTEM'}
                textSub={currentTrack ? `${currentTrack.artist} — ${currentTrack.album}` : 'LOCAL MUSIC PLAYER'}
                artUrl={currentTrack?.cover}
                currentTrack={currentTrack || undefined}
                menuItems={currentMenuItems}
                menuTracks={selectedFolder ? selectedFolder.tracks : tracks}
                selectedIndex={menuIndex}
                isPlaying={isPlaying}
                progressPercent={percent}
                duration={duration}
                einkSubMode={einkSubMode}
                columns={24}
                rows={30}
                width={380}
                height={320}
                onSelectMenuItem={handleMenuSelect}
                onMenuScroll={handleMenuScroll}
              />
            )}
          </div>
        </div>

        {/* CONTROL DIVIDER & BRAUN SEEKER (TOP ORANGE PROGRESS BAR + BOTTOM 8 SPACED DOTS) */}
        <div
          style={{
            padding: '10px 18px 2px 18px',
            backgroundColor: 'var(--device-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {/* Top Seeker Progress Bar Rail */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, clickX / rect.width));
              const maxDur = duration && duration > 0 ? duration : (currentTrack?.duration || 0);
              if (maxDur > 0) seekTo(pct * maxDur);
            }}
            onMouseDown={(e) => {
              isSeekingRef.current = true;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, clickX / rect.width));
              const maxDur = duration && duration > 0 ? duration : (currentTrack?.duration || 0);
              if (maxDur > 0) seekTo(pct * maxDur);
            }}
            onMouseMove={(e) => {
              if (isSeekingRef.current) {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                const maxDur = duration && duration > 0 ? duration : (currentTrack?.duration || 0);
                if (maxDur > 0) seekTo(pct * maxDur);
              }
            }}
            onMouseUp={() => { isSeekingRef.current = false; }}
            onMouseLeave={() => { isSeekingRef.current = false; }}
            style={{
              position: 'relative',
              width: '100%',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            title="Click or drag to seek track position"
          >
            {/* Background Rail */}
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#C5C3BA',
                borderRadius: '2px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Braun Orange Fill Bar with Glow */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${percent}%`,
                  backgroundColor: '#F36F21',
                  borderRadius: '2px',
                  boxShadow: '0 0 6px rgba(243, 111, 33, 0.75)',
                  transition: 'width 100ms linear'
                }}
              />
            </div>
          </div>

          {/* Bottom 8 Spaced Dots Line */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => {
                  const maxDur = duration && duration > 0 ? duration : (currentTrack?.duration || 0);
                  if (maxDur > 0) seekTo((idx / 7) * maxDur);
                }}
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#242424',
                  cursor: 'pointer'
                }}
                title={`Seek to ${Math.round((idx / 7) * 100)}%`}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM CONTROL SECTION: CENTRAL CLICK WHEEL CONTROL */}
        <div
          style={{
            padding: isMiniPlayer ? '16px 20px 48px 20px' : '12px 20px 24px 20px',
            backgroundColor: 'var(--device-bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            position: 'relative'
          }}
        >
          {/* BRAND MARK & WAVEFORM VISUALIZER HEADER ROW */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  color: 'var(--dark-content)',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1
                }}
              >
                DRAUN
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--secondary)', marginTop: '2px', letterSpacing: '0.04em' }}>
                by i.am.krs
              </span>
            </div>

            {/* DOT-MATRIX VERTICAL WAVEFORM AUDIO VISUALIZER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <DotPlaybackIcon isPlaying={isPlaying} />
            </div>
          </div>

          {/* PRIMARY CENTRAL CLICK WHEEL CONTROL */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
            <RotaryDial
              value={matrixMode === 'menu' ? (menuIndex / (tracks.length)) * 100 : volume}
              mode={matrixMode === 'menu' ? 'browse' : 'volume'}
              onChange={handleDialChange}
              onConfirm={handleDialConfirm}
              onMenu={() => {
                if (matrixMode === 'menu') {
                  setMatrixMode('speaker');
                  setIsMenuExpanded(false);
                } else {
                  setMatrixMode('menu');
                  setIsMenuExpanded(true);
                }
              }}
              onPrev={previousTrack}
              onNext={nextTrack}
              onPlayPause={togglePlayPause}
              onScrollStep={handleMenuScroll}
              size={175}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
