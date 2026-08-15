import React, { useRef, useEffect, useState } from 'react';

interface MarqueeFadeTextProps {
  text: string;
  isPlaying?: boolean;
  bgColor?: string; // Background color for exact matching fade edges
  speed?: number; // seconds per cycle
  style?: React.CSSProperties;
}

const MarqueeFadeTextComponent: React.FC<MarqueeFadeTextProps> = ({
  text,
  bgColor = 'var(--surface-2)',
  speed = 12,
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(text.length > 20);

  useEffect(() => {
    const checkOverflow = () => {
      const container = containerRef.current;
      const measure = measureRef.current;
      if (container && measure) {
        const overflow = text.length > 20 || measure.scrollWidth > (container.clientWidth - 4);
        setIsOverflowing(overflow);
      } else {
        setIsOverflowing(text.length > 20);
      }
    };

    checkOverflow();
    const rafId = requestAnimationFrame(checkOverflow);
    const timeoutId = setTimeout(checkOverflow, 50);
    window.addEventListener('resize', checkOverflow);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {/* Hidden element for measuring exact width */}
      <span
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          height: 0,
          whiteSpace: 'nowrap',
          fontSize: style?.fontSize || '13px',
          fontWeight: style?.fontWeight || 700,
          letterSpacing: style?.letterSpacing || '0.08em',
          fontFamily: style?.fontFamily || 'inherit'
        }}
      >
        {text}
      </span>

      <div
        style={{
          display: 'inline-flex',
          whiteSpace: 'nowrap',
          animation: isOverflowing ? `slideFadeMarquee ${speed}s linear infinite` : 'none',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        <span>{text}</span>
        {isOverflowing && (
          <span style={{ paddingLeft: '32px' }}>{text}</span>
        )}
      </div>

      {/* LEFT FADE OVERLAY MATCHING EXACT BACKGROUND COLOR */}
      {isOverflowing && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '24px',
            background: `linear-gradient(to right, ${bgColor}, transparent)`,
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
      )}

      {/* RIGHT FADE OVERLAY MATCHING EXACT BACKGROUND COLOR */}
      {isOverflowing && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '24px',
            background: `linear-gradient(to left, ${bgColor}, transparent)`,
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
      )}
    </div>
  );
};

// React.memo prevents component re-renders when parent ticks time updates during playback
export const MarqueeFadeText = React.memo(MarqueeFadeTextComponent, (prevProps, nextProps) => {
  return (
    prevProps.text === nextProps.text &&
    prevProps.bgColor === nextProps.bgColor &&
    prevProps.speed === nextProps.speed
  );
});
