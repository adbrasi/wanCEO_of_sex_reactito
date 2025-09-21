'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { GenerationHistory } from '@/lib/storage';

interface HistoryGalleryProps {
  items: GenerationHistory[];
  title: string;
  onDelete: (id: string) => void;
  onCancel?: (jobId: string) => void;
  onSelect: (item: GenerationHistory) => void;
  selectedId?: string | null;
  thumbSize: number;
}

const STATUS_STYLES: Record<GenerationHistory['status'], { label: string; bg: string; text: string }> = {
  pending: {
    label: 'Processing',
    bg: 'bg-warning-100 text-warning-700',
    text: 'text-warning-700'
  },
  completed: {
    label: 'Ready',
    bg: 'bg-accent-100 text-accent-700',
    text: 'text-accent-700'
  },
  failed: {
    label: 'Failed',
    bg: 'bg-danger-100 text-danger-700',
    text: 'text-danger-700'
  }
};

function formatDate(timestamp: number): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric'
  });
  return formatter.format(new Date(timestamp));
}

export default function HistoryGallery({
  items,
  title,
  onDelete,
  onCancel,
  onSelect,
  selectedId,
  thumbSize
}: HistoryGalleryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    if (hoveredId && videoRefs.current[hoveredId]) {
      videoRefs.current[hoveredId]?.play();
    }

    Object.keys(videoRefs.current).forEach(id => {
      if (id !== hoveredId && videoRefs.current[id]) {
        videoRefs.current[id]?.pause();
        if (videoRefs.current[id]) {
          videoRefs.current[id]!.currentTime = 0;
        }
      }
    });
  }, [hoveredId]);

  const hasItems = items.length > 0;
  const columnMin = Math.min(Math.max(thumbSize, 140), 420);
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(auto-fit, minmax(${columnMin}px, 1fr))`
  }), [columnMin]);

  if (!hasItems) return null;

  const handleCardClick = (item: GenerationHistory) => {
    onSelect(item);
  };

  const downloadVideo = (item: GenerationHistory) => {
    if (!item.videoUrl) return;
    const a = document.createElement('a');
    a.href = item.videoUrl;
    a.download = `video-${item.id}.mp4`;
    a.click();
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          {title}
          <span className="ml-2 text-sm font-medium text-slate-400">{items.length}</span>
        </h3>
      </header>

      <div className="grid gap-5" style={gridStyle}>
        {items.map((item) => {
          const status = STATUS_STYLES[item.status];
          const isSelected = selectedId === item.id;

          return (
            <article
              key={item.id}
              className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white/85 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-brand ${
                isSelected ? 'border-brand-400 shadow-brand' : 'border-slate-100'
              }`}
              onClick={() => handleCardClick(item)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50" style={{ paddingBottom: '66%' }}>
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5">
                  {item.videoUrl && item.status === 'completed' ? (
                    <video
                      ref={(el) => (videoRefs.current[item.id] = el)}
                      src={item.videoUrl}
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : item.imagePreview ? (
                    <img src={item.imagePreview} alt={item.prompt} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m0-4v4m0-4L9 6m6 4L9 14m0-8l-4.553-2.276A1 1 0 003 4.618v14.764a1 1 0 001.447.894L9 18m0-12v12" />
                      </svg>
                    </div>
                  )}
                </div>
                {item.status === 'pending' && (
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/60">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${Math.min(item.progress ?? 5, 96)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p
                    className="flex-1 text-sm font-semibold leading-snug text-slate-800"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {item.prompt || 'Untitled prompt'}
                  </p>
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${status.bg}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{item.resolution} • {item.frames} frames</span>
                  <span>{formatDate(item.timestamp)}</span>
                </div>

                {item.status === 'pending' && item.current_node && (
                  <div className="text-xs font-medium text-warning-700">
                    {item.current_node}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 text-slate-600">
                {item.status === 'completed' && item.videoUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadVideo(item);
                    }}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
                    title="Download"
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (item.status === 'pending' && onCancel && item.jobId) {
                      await onCancel(item.jobId);
                    }
                    onDelete(item.id);
                  }}
                  className="rounded-full border border-danger-200 bg-danger-50 p-2 text-danger-600 transition hover:bg-danger-500 hover:text-white"
                  title={item.status === 'pending' ? 'Cancel job' : 'Delete'}
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
