import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { X, Trash2, Play, ChevronUp, ChevronDown } from 'lucide-react';
import { formatTime } from './ProgressBar';

export const QueuePanel: React.FC = () => {
  const {
    queue,
    queueIndex,
    currentTrack,
    isQueueOpen,
    setIsQueueOpen,
    playTrack,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    settings
  } = usePlayer();

  if (!isQueueOpen) return null;

  const current = currentTrack || queue[queueIndex];
  const upNext = queue.slice(queueIndex + 1);

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const newQ = [...queue];
    const targetIdx = queueIndex + 1 + index;
    const swapIdx = targetIdx - 1;
    const temp = newQ[targetIdx];
    newQ[targetIdx] = newQ[swapIdx];
    newQ[swapIdx] = temp;
    reorderQueue(newQ);
  };

  const moveDown = (index: number) => {
    if (index >= upNext.length - 1) return;
    const newQ = [...queue];
    const targetIdx = queueIndex + 1 + index;
    const swapIdx = targetIdx + 1;
    const temp = newQ[targetIdx];
    newQ[targetIdx] = newQ[swapIdx];
    newQ[swapIdx] = temp;
    reorderQueue(newQ);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: '64px',
        width: '360px',
        maxWidth: '100vw',
        backgroundColor: 'var(--bg)',
        borderLeft: 'var(--border-width) solid var(--border)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: settings.displayMode === 'eink' ? 'none' : '-4px 0 16px rgba(0,0,0,0.05)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: 'var(--border-width) solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
            [QUEUE]
          </span>
          <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em' }}>
            PLAYBACK QUEUE ({queue.length})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={clearQueue}
            className="btn-hardware"
            style={{ padding: '4px 8px', fontSize: '10px', gap: '4px' }}
            title="Clear Queue"
          >
            <Trash2 size={12} />
            <span>CLEAR</span>
          </button>
          <button
            onClick={() => setIsQueueOpen(false)}
            className="btn-icon"
            style={{ width: '28px', height: '28px' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Queue Content List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* NOW PLAYING ITEM */}
        <div>
          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            NOW PLAYING
          </span>
          {current ? (
            <div
              style={{
                padding: '12px',
                border: 'var(--border-width) solid var(--text)',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{current.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{current.artist} — {current.album}</div>
              </div>
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>
                {formatTime(current.duration)}
              </span>
            </div>
          ) : (
            <div style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
              No track currently loaded.
            </div>
          )}
        </div>

        {/* UP NEXT LIST */}
        <div style={{ flex: 1 }}>
          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            UP NEXT ({upNext.length})
          </span>
          {upNext.length === 0 ? (
            <div style={{ padding: '16px 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
              End of queue. Add tracks or albums to continue.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {upNext.map((trk, i) => (
                <div
                  key={`${trk.id}-${i}`}
                  style={{
                    padding: '8px 10px',
                    border: 'var(--border-width) solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '20px' }}>
                      {i + 1}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {trk.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {trk.artist}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginRight: '4px' }}>
                      {formatTime(trk.duration)}
                    </span>
                    <button
                      onClick={() => moveUp(i)}
                      className="btn-icon"
                      style={{ width: '24px', height: '24px', border: 'none' }}
                      title="Move Up"
                      disabled={i === 0}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      className="btn-icon"
                      style={{ width: '24px', height: '24px', border: 'none' }}
                      title="Move Down"
                      disabled={i === upNext.length - 1}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => playTrack(trk, queue)}
                      className="btn-icon"
                      style={{ width: '24px', height: '24px', border: 'none' }}
                      title="Play Now"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      onClick={() => removeFromQueue(queueIndex + 1 + i)}
                      className="btn-icon"
                      style={{ width: '24px', height: '24px', border: 'none' }}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
