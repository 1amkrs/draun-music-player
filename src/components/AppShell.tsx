import React, { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { PhysicalDeviceAppliance } from './PhysicalDeviceAppliance';

export const AppShell: React.FC = () => {
  const {
    togglePlayPause,
    previousTrack,
    nextTrack,
    toggleMute,
    currentTrack,
    toggleFavorite,
    setDisplayMode,
    settings
  } = usePlayer();

  // Global Hardware Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousTrack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextTrack();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          if (currentTrack) {
            e.preventDefault();
            toggleFavorite(currentTrack.id);
          }
          break;
        case '1':
          setDisplayMode('eink');
          break;
        case '2':
          setDisplayMode('standard');
          break;
        case '3':
          setDisplayMode('dark');
          break;
        case '4':
          setDisplayMode('high-contrast');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, previousTrack, nextTrack, toggleMute, currentTrack, toggleFavorite, setDisplayMode]);

  return <PhysicalDeviceAppliance />;
};
