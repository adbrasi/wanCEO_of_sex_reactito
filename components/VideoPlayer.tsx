'use client';

import { useState, useRef, useEffect } from 'react';
import { GenerationHistory } from '@/lib/storage';

interface VideoPlayerProps {
  item: GenerationHistory;
  onClose?: () => void;
}

export default function VideoPlayer({ item, onClose }: VideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Reset error state when item changes
    setHasError(false);
  }, [item.videoUrl]);

  const handleVideoError = () => {
    console.error('Video playback error for:', item.videoUrl);
    setHasError(true);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'relative w-full h-full'} flex items-center justify-center`}>
      {item.videoUrl && !hasError ? (
        <video
          ref={videoRef}
          controls
          autoPlay
          loop
          muted
          playsInline
          className={`${isFullscreen ? 'max-w-full max-h-full' : 'w-full h-full object-contain'}`}
          onError={handleVideoError}
        >
          <source src={item.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : hasError ? (
        <div className="w-full aspect-square bg-gray-900 flex items-center justify-center">
          <div className="text-center p-4">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-300">Video playback error</p>
            <p className="text-sm text-gray-400 mt-2">Try downloading the video instead</p>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-square bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-white"></div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-white/80 backdrop-blur p-2 rounded-lg hover:bg-white transition-colors"
        >
          {isFullscreen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          )}
        </button>

        {item.videoUrl && (
          <a
            href={item.videoUrl}
            download={`video-${item.id}.mp4`}
            className="bg-white/80 backdrop-blur p-2 rounded-lg hover:bg-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="bg-white/80 backdrop-blur p-2 rounded-lg hover:bg-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}