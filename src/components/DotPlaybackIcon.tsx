import React, { useState, useEffect, useRef } from 'react';

interface DotPlaybackIconProps {
  state?: 'play' | 'pause' | 'next' | 'prev';
  isPlaying?: boolean;
}

export const DotPlaybackIcon: React.FC<DotPlaybackIconProps> = ({ isPlaying = false }) => {
  const NUM_COLS = 15;
  const flatHeights = Array(NUM_COLS).fill(1); // Flat single baseline on pause
  const activeBaseHeights = [7, 9, 6, 8, 5, 7, 9, 6, 8, 5, 7, 6, 5, 4, 3];

  const [colHeights, setColHeights] = useState<number[]>(flatHeights);
  const currentHeightsRef = useRef<number[]>(flatHeights);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;

      if (!isPlaying) {
        // Smooth aesthetic decay to a flat single baseline when paused
        let isFullyFlat = true;
        const nextHeights = currentHeightsRef.current.map((h) => {
          if (h > 1) {
            isFullyFlat = false;
            return Math.max(1, h - 0.4); // Smooth decay step
          }
          return 1;
        });

        currentHeightsRef.current = nextHeights;
        setColHeights(nextHeights.map(h => Math.round(h)));

        if (!isFullyFlat) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
        return;
      }

      // 60FPS fluid harmonic audio equalizer visualization when playing
      const nextHeights = activeBaseHeights.map((base, idx) => {
        const w1 = Math.sin(elapsed * 5.5 + idx * 0.5);
        const w2 = Math.cos(elapsed * 8.8 - idx * 0.4);
        const w3 = Math.sin(elapsed * 14.0 + idx * 0.8) * 0.35;
        
        const envelope = (w1 + w2 + w3 + 2.35) / 4.7;
        const target = Math.max(1, Math.round(base * envelope + Math.sin(elapsed * 16 + idx) * 0.75));
        return Math.min(9, target);
      });

      currentHeightsRef.current = nextHeights;
      setColHeights(nextHeights);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0
      }}
      title={isPlaying ? "Dot-Matrix Fluid Audio Equalizer (Playing)" : "Dot-Matrix Equalizer (Flat Baseline on Pause)"}
    >
      <svg
        width="76"
        height="26"
        viewBox="0 0 76 26"
        fill="none"
        aria-label="Dot-Matrix Waveform Visualizer"
        style={{ display: 'block' }}
      >
        {colHeights.map((height, cIdx) => {
          const x = 3 + cIdx * 4.8;
          const halfH = Math.floor(height / 2);

          return Array.from({ length: height }).map((_, rIdx) => {
            const offset = rIdx - halfH;
            const y = 13 + offset * 2.6;
            const isCenterPeak = isPlaying && offset === 0;

            return (
              <circle
                key={`${cIdx}-${rIdx}`}
                cx={x}
                cy={y}
                r={isPlaying ? "1.1" : "1.0"}
                fill={isCenterPeak ? 'var(--accent)' : 'var(--dark-content)'}
                opacity={!isPlaying ? 0.45 : 0.85}
                style={{
                  transition: 'cy 40ms linear, fill 60ms linear, opacity 100ms linear'
                }}
              />
            );
          });
        })}
      </svg>
    </div>
  );
};
