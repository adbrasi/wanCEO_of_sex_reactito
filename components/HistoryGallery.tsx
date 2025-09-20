'use client';

import { GenerationHistory } from '@/lib/storage';
import VideoPlayer from './VideoPlayer';
import { useState, useRef, useEffect } from 'react';

interface HistoryGalleryProps {
  items: GenerationHistory[];
  title: string;
  onDelete: (id: string) => void;
  onCancel?: (jobId: string) => void;
}

export default function HistoryGallery({ items, title, onDelete, onCancel }: HistoryGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<GenerationHistory | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    // Handle video preview on hover
    if (hoveredId && videoRefs.current[hoveredId]) {
      videoRefs.current[hoveredId]?.play();
    }

    // Pause all other videos
    Object.keys(videoRefs.current).forEach(id => {
      if (id !== hoveredId && videoRefs.current[id]) {
        videoRefs.current[id]?.pause();
        if (videoRefs.current[id]) {
          videoRefs.current[id]!.currentTime = 0;
        }
      }
    });
  }, [hoveredId]);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;

      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        const newIndex = selectedIndex - 1;
        setSelectedIndex(newIndex);
        setSelectedItem(items[newIndex]);
      } else if (e.key === 'ArrowRight' && selectedIndex < items.length - 1) {
        const newIndex = selectedIndex + 1;
        setSelectedIndex(newIndex);
        setSelectedItem(items[newIndex]);
      } else if (e.key === 'Escape') {
        setSelectedItem(null);
        setSelectedIndex(-1);
      }
    };

    if (selectedItem) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItem, selectedIndex, items]);

  if (items.length === 0) return null;

  const downloadVideo = (e: React.MouseEvent, item: GenerationHistory) => {
    e.stopPropagation();
    if (item.videoUrl) {
      const a = document.createElement('a');
      a.href = item.videoUrl;
      a.download = `video-${item.id}.mp4`;
      a.click();
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">{title} ({items.length})</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300"
            onClick={() => {
              setSelectedItem(item);
              setSelectedIndex(index);
            }}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Thumbnail Container with proper aspect ratio */}
            <div className="relative bg-gray-100" style={{ paddingBottom: '100%' }}>
              <div className="absolute inset-0 flex items-center justify-center p-2">
                {item.videoUrl && item.status === 'completed' ? (
                  <video
                    ref={(el) => videoRefs.current[item.id] = el}
                    src={item.videoUrl}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  item.imagePreview && (
                    <img
                      src={item.imagePreview}
                      alt={item.prompt}
                      className="w-full h-full object-contain"
                    />
                  )
                )}
              </div>

              {/* Status Overlays */}
              {item.status === 'pending' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
                </div>
              )}

              {item.status === 'failed' && (
                <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}

              {/* Play Button Overlay for Completed Videos */}
              {item.status === 'completed' && item.videoUrl && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center pointer-events-none">
                  <svg className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Download Button */}
                {item.status === 'completed' && item.videoUrl && (
                  <button
                    onClick={(e) => downloadVideo(e, item)}
                    className="bg-white/90 backdrop-blur p-2 rounded-lg hover:bg-white transition-colors shadow-lg"
                    title="Download"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}

                {/* Delete/Cancel Button - always show for all states */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();

                    // For pending items, always try to cancel the job on API first
                    if (item.status === 'pending' && onCancel && item.jobId) {
                      await onCancel(item.jobId);
                    }

                    // Always delete from local storage
                    onDelete(item.id);
                  }}
                  className="bg-red-500/90 backdrop-blur p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                  title={item.status === 'pending' ? 'Cancel' : 'Delete'}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-3 bg-white">
              <p className="text-sm text-gray-700 truncate font-medium">{item.prompt}</p>
              <p className="text-xs text-gray-500 mt-1">{item.resolution} • {item.frames} frames</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Selected Video */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 md:p-8" onClick={() => {
          setSelectedItem(null);
          setSelectedIndex(-1);
        }}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header with close button */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Video Preview</h3>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedIndex(-1);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video content - scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="aspect-square max-w-full mx-auto bg-black rounded-lg overflow-hidden">
                <VideoPlayer item={selectedItem} onClose={() => setSelectedItem(null)} />
              </div>

              {/* Details section */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-800">Details</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 break-words"><span className="font-medium">Prompt:</span> {selectedItem.prompt}</p>
                  <p className="text-gray-600"><span className="font-medium">Resolution:</span> {selectedItem.resolution}</p>
                  <p className="text-gray-600"><span className="font-medium">Frames:</span> {selectedItem.frames}</p>
                  <p className="text-gray-500 mt-2 text-xs">{new Date(selectedItem.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}