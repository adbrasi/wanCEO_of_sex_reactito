'use client';

import { useState } from 'react';
import { GenerationHistory } from '@/lib/storage';

interface VideoPlayerProps {
  item: GenerationHistory;
  onClose?: () => void;
}

export default function VideoPlayer({ item, onClose }: VideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'relative'} flex items-center justify-center`}>
      {item.videoUrl ? (
        <video
          controls
          autoPlay
          loop
          className={`${isFullscreen ? 'max-w-full max-h-full' : 'w-full rounded-lg'}`}
          src={item.videoUrl}
        />
      ) : (
        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing... {item.progress}%</p>
          </div>
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