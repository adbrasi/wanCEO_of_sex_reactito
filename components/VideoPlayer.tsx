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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset error state when item changes
    setHasError(false);
    if (variant === 'inline') {
      setIsFullscreen(false);
    }
  }, [item.videoUrl, variant]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const entering = document.fullscreenElement === wrapperRef.current;
      setIsFullscreen(entering);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleVideoError = () => {
    console.error('Video playback error for:', item.videoUrl);
    setHasError(true);
  };

  const isInline = variant === 'inline' && !isFullscreen;

  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {
        setIsFullscreen(false);
      });
    } else {
      await wrapperRef.current.requestFullscreen().catch(() => {
        setIsFullscreen((prev) => !prev);
      });
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`${
        isFullscreen ? 'fixed inset-0 z-50 bg-black/95' : 'relative'
      } flex h-full w-full items-center justify-center transition-all duration-300 ${className}`.trim()}
    >
      {item.videoUrl && !hasError && item.status === 'completed' ? (
        <video
          ref={videoRef}
          controls
          autoPlay
          loop
          muted
          playsInline
          className={`${
            isFullscreen ? 'max-h-full max-w-full' : 'h-full w-full rounded-2xl object-contain'
          } shadow-lg`}
          onError={handleVideoError}
        >
          <source src={item.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : item.status === 'pending' ? (
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl bg-slate-900/80 p-8">
          <div className="text-center text-slate-200">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-brand-400"></div>
            <p className="text-sm font-medium uppercase tracking-wide text-brand-100">Generating…</p>
            {typeof item.progress === 'number' && (
              <p className="mt-2 text-xs text-slate-300">
                {item.progress}% {item.current_node ? `• ${item.current_node}` : ''}
              </p>
            )}
          </div>
        </div>
      ) : hasError ? (
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl bg-slate-900/80 p-8 text-center">
          <div>
            <svg className="mx-auto mb-4 h-12 w-12 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-semibold text-white">Video playback error</p>
            <p className="mt-2 text-sm text-slate-200">Try downloading the video instead.</p>
          </div>
        </div>
      ) : (
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl bg-slate-900/80 p-8 text-slate-200">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-white"></div>
            <p className="text-sm text-slate-300">Preparing preview…</p>
          </div>
        </div>
      )}

      {(item.videoUrl || onClose) && (
        <div
          className={`${
            isInline ? 'absolute bottom-4 right-4 flex gap-2' : 'fixed top-6 right-6 flex gap-3'
          } text-slate-900`}
        >
          {item.videoUrl && (
            <a
              href={item.videoUrl}
              download={`video-${item.id}.mp4`}
              className="rounded-full bg-white/80 p-2 shadow-md backdrop-blur hover:bg-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          )}

          <button
            onClick={toggleFullscreen}
            className="rounded-full bg-white/80 p-2 shadow-md backdrop-blur hover:bg-white"
            type="button"
          >
            {isFullscreen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l6 6m10-2V4m0 0h-4m4 0l-6 6M4 16v4m0 0h4m-4 0l6-6m10 2v4m0 0h-4m4 0l-6-6" />
              </svg>
            )}
          </button>

          {onClose && !isInline && (
            <button
              onClick={onClose}
              className="rounded-full bg-white/80 p-2 shadow-md backdrop-blur hover:bg-white"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
