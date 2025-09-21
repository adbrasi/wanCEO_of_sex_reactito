'use client';

import { GenerationHistory } from '@/lib/storage';

interface HistoryBoardProps {
  sections: Array<{ title: string; items: GenerationHistory[] }>;
  onSelect: (item: GenerationHistory) => void;
  selectedId?: string | null;
  onDelete: (id: string) => void;
  onCancel?: (jobId: string) => void;
}

const STATUS_TONES: Record<GenerationHistory['status'], string> = {
  pending: 'text-brand-200 bg-brand-500/10 border border-brand-500/40',
  completed: 'text-accent-200 bg-accent-500/10 border border-accent-500/30',
  failed: 'text-danger-200 bg-danger-500/10 border border-danger-500/40'
};

function formatTimestamp(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function HistoryBoard({ sections, onSelect, selectedId, onDelete, onCancel }: HistoryBoardProps) {
  return (
    <aside className="flex h-full flex-col gap-5 rounded-4xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_25px_50px_-30px_rgba(2,6,23,0.8)] backdrop-blur">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Timeline</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Render History</h2>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            {section.items.length > 0 && (
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {section.title}
              </h3>
            )}
            <div className="space-y-3">
              {section.items.map((item) => {
                const tone = STATUS_TONES[item.status];
                const isSelected = selectedId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`w-full rounded-3xl border border-slate-800 bg-slate-900/60 text-left transition transform hover:-translate-y-1 hover:border-brand-500/40 overflow-hidden ${
                      isSelected ? 'border-brand-500/50 shadow-lg shadow-brand-500/20' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="w-full p-4"
                    >
                      <div className="grid grid-cols-[80px_1fr] gap-3">
                        {/* Fixed thumbnail container */}
                        <div className="relative h-[60px] w-[80px] overflow-hidden rounded-xl border border-slate-800 bg-black">
                          {item.videoUrl ? (
                            <video
                              src={item.videoUrl}
                              muted
                              playsInline
                              loop
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <img src={item.imagePreview} alt={item.prompt} className="absolute inset-0 h-full w-full object-cover" />
                          )}
                        </div>

                        {/* Content container */}
                        <div className="min-w-0">
                          {/* Title and status badge */}
                          <div className="flex items-start gap-2 mb-1">
                            <p className="flex-1 truncate text-sm font-semibold text-slate-100 pr-2">
                              {item.prompt || 'Untitled prompt'}
                            </p>
                            <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold ${tone}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {item.status === 'pending' ? 'Rendering' : item.status === 'completed' ? 'Ready' : 'Failed'}
                            </span>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 mb-2">
                            <span>{item.resolution}</span>
                            <span>•</span>
                            <span>{item.frames}f</span>
                            <span>•</span>
                            <span>{formatTimestamp(item.timestamp)}</span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            {item.status === 'completed' && item.videoUrl && (
                              <a
                                href={item.videoUrl}
                                download={`video-${item.id}.mp4`}
                                onClick={(event) => event.stopPropagation()}
                                className="rounded-full border border-slate-700/60 px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-slate-400 hover:border-brand-400 hover:text-brand-200"
                              >
                                Download
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (item.status === 'pending' && onCancel && item.jobId) {
                                  onCancel(item.jobId);
                                }
                                onDelete(item.id);
                              }}
                              className="rounded-full border border-danger-500/30 px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-danger-200 hover:border-danger-400 hover:text-white"
                            >
                              {item.status === 'pending' ? 'Cancel' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {sections.every((section) => section.items.length === 0) && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
            Your renders will appear here as soon as they finish.
          </div>
        )}
      </div>
    </aside>
  );
}
