'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { GenerationHistory } from '@/lib/storage';

type VideoPlayerVariant = 'inline' | 'modal';

interface VideoPlayerProps {
  item: GenerationHistory;
  onClose?: () => void;
  variant?: VideoPlayerVariant;
  className?: string;
}

export default function VideoPlayer({ item, onClose, variant = 'inline', className = '' }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset error state when item changes
    setHasError(false);
  }, [item.videoUrl]);

  const handleVideoError = () => {
    console.log('Video not available:', item.videoUrl);
    setHasError(true);
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative flex h-full w-full items-center justify-center ${className}`.trim()}
    >
      {item.videoUrl && !hasError && item.status === 'completed' ? (
        <video
          key={item.videoUrl}
          ref={videoRef}
          controls
          autoPlay
          loop
          muted
          playsInline
          className="max-h-[60vh] w-full rounded-2xl object-contain shadow-lg"
          onError={handleVideoError}
          src={item.videoUrl}
        >
          Your browser does not support the video tag.
        </video>
      ) : item.status === 'pending' ? (
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl bg-slate-900/80 p-8">
          <div className="text-center text-slate-200">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-brand-400"></div>
            <p className="text-sm font-medium uppercase tracking-wide text-brand-100">Generating…</p>
          </div>
        </div>
      ) : (hasError || (item.status === 'completed' && !item.videoUrl)) ? (
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl bg-slate-900/80 p-8">
          <img src={item.imagePreview} alt={item.prompt} className="h-full w-full rounded-2xl object-contain" />
        </div>
      ) : (
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl bg-slate-900/80 p-8 text-slate-200">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-white"></div>
            <p className="text-sm text-slate-300">Preparing preview…</p>
          </div>
        </div>
      )}

      {item.videoUrl && item.status === 'completed' && !hasError && (
        <div className="absolute top-2 right-2 z-10">
          <a
            href={item.videoUrl}
            download={`video-${item.id}.mp4`}
            className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/80 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      )}
    </div>
  );
}
