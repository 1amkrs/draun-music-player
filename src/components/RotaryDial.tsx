import React, { useState, useRef, useEffect } from 'react';

interface RotaryDialProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  mode?: 'volume' | 'tune' | 'browse';
  onChange?: (val: number) => void;
  onConfirm?: () => void;
  onMenu?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onPlayPause?: () => void;
  onScrollStep?: (delta: number) => void;
  size?: number;
}

export const RotaryDial: React.FC<RotaryDialProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  mode = 'volume',
  onChange,
  onConfirm,
  onMenu,
  onPrev,
  onNext,
  onPlayPause,
  onScrollStep,
  size = 180
}) => {
  const isDraggingRef = useRef<boolean>(false);
  const lastAngleRef = useRef<number>(0);
  const accumulatedAngleRef = useRef<number>(0);
  const wheelAccumulatorRef = useRef<number>(0);
  const dialRef = useRef<HTMLDivElement | null>(null);

  const valueRef = useRef<number>(value);
  const modeRef = useRef<string>(mode);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Native non-passive wheel listener for smooth trackpads & mouse wheels
  useEffect(() => {
    const dialEl = dialRef.current;
    if (!dialEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const isBrowse = modeRef.current === 'browse';
      const rawDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      // Normalize wheel delta across delta modes (pixels vs lines vs pages)
      let normalizedDelta = rawDelta;
      if (e.deltaMode === 1) normalizedDelta *= 16;
      else if (e.deltaMode === 2) normalizedDelta *= 400;

      if (isBrowse) {
        // Step scrolling for menu items
        wheelAccumulatorRef.current += normalizedDelta;
        const threshold = 16;
        if (Math.abs(wheelAccumulatorRef.current) >= threshold) {
          const steps = Math.trunc(wheelAccumulatorRef.current / threshold);
          wheelAccumulatorRef.current %= threshold;
          const dir = steps > 0 ? 1 : -1;
          if (onScrollStep) onScrollStep(dir);
        }
      } else if (onChange) {
        // Smooth linear volume scrolling with accumulator
        wheelAccumulatorRef.current += normalizedDelta;
        const threshold = 10; // 10px accumulated delta per volume step

        if (Math.abs(wheelAccumulatorRef.current) >= threshold) {
          const steps = Math.trunc(wheelAccumulatorRef.current / threshold);
          wheelAccumulatorRef.current %= threshold;
          
          // Scroll UP (negative delta) => increase volume (+2 per step)
          // Scroll DOWN (positive delta) => decrease volume (-2 per step)
          const deltaVolume = -steps * 2;
          const currentVal = valueRef.current;
          const newVal = Math.max(min, Math.min(max, currentVal + deltaVolume));

          if (newVal !== currentVal) {
            valueRef.current = newVal;
            onChange(newVal);
          }
        }
      }
    };

    dialEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      dialEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, [min, max, step, onChange, onScrollStep]);

  // Global window mouse drag tracking for continuous rotary dragging anywhere on screen
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let delta = currentAngle - lastAngleRef.current;

      // Normalize angle delta across PI boundary
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;

      lastAngleRef.current = currentAngle;
      const deg = (delta * 180) / Math.PI;

      if (modeRef.current === 'browse') {
        accumulatedAngleRef.current += deg;
        const stepThreshold = 15;
        if (Math.abs(accumulatedAngleRef.current) >= stepThreshold) {
          const stepDir = accumulatedAngleRef.current > 0 ? 1 : -1;
          accumulatedAngleRef.current = 0;
          if (onScrollStep) onScrollStep(stepDir);
        }
      } else if (onChange) {
        const currentVal = valueRef.current;
        const valueRange = max - min;
        const valueDelta = (deg / 240) * valueRange; // 240 deg full sweep
        const newVal = Math.max(min, Math.min(max, Math.round((currentVal + valueDelta) / step) * step));
        if (newVal !== currentVal) {
          valueRef.current = newVal;
          onChange(newVal);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      accumulatedAngleRef.current = 0;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [min, max, step, onChange, onScrollStep]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dialRef.current) return;
    isDraggingRef.current = true;
    accumulatedAngleRef.current = 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (modeRef.current === 'browse' && onScrollStep) {
        onScrollStep(1);
      } else if (onChange) {
        const newVal = Math.min(max, valueRef.current + step * 4);
        valueRef.current = newVal;
        onChange(newVal);
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (modeRef.current === 'browse' && onScrollStep) {
        onScrollStep(-1);
      } else if (onChange) {
        const newVal = Math.max(min, valueRef.current - step * 4);
        valueRef.current = newVal;
        onChange(newVal);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onConfirm) onConfirm();
    }
  };

  return (
    <div
      ref={dialRef}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label="Click Wheel Control"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D8D6CE',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06), inset 0 1px 3px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        position: 'relative',
        userSelect: 'none',
        outline: 'none'
      }}
      title="Click Wheel Control Dial: Scroll or drag wheel to adjust volume/browse menu. Click center to Select/Confirm."
    >
      {/* CARDINAL HARDWARE LABELS & BUTTON ACTION AREAS */}
      
      {/* TOP: MENU */}
      <button
        className="click-wheel-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (onMenu) onMenu();
        }}
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '11px',
          letterSpacing: '0.06em',
          color: '#A09E96',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 12px'
        }}
        title="Toggle Menu Catalog"
      >
        MENU
      </button>

      {/* LEFT: PREVIOUS TRACK (|◀◀) */}
      <button
        className="click-wheel-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (onPrev) onPrev();
        }}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '11px',
          color: '#A09E96',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '12px 4px'
        }}
        title="Previous Track"
      >
        &#9475;&#9664;&#9664;
      </button>

      {/* RIGHT: NEXT TRACK (▶▶|) */}
      <button
        className="click-wheel-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (onNext) onNext();
        }}
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '11px',
          color: '#A09E96',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '12px 4px'
        }}
        title="Next Track"
      >
        &#9654;&#9654;&#9475;
      </button>

      {/* BOTTOM: PLAY / PAUSE (▶ ||) */}
      <button
        className="click-wheel-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (onPlayPause) onPlayPause();
        }}
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '11px',
          color: '#A09E96',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 12px'
        }}
        title="Play / Pause"
      >
        &#9654; &#10073;&#10073;
      </button>

      {/* EXACT CENTER TACTILE SELECTION BUTTON */}
      <div
        className="click-wheel-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (onConfirm) onConfirm();
        }}
        style={{
          width: `${Math.round(size * 0.36)}px`,
          height: `${Math.round(size * 0.36)}px`,
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5D3CD',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.9), 0 2px 6px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10
        }}
        title="Select / Confirm / Play"
      />
    </div>
  );
};
