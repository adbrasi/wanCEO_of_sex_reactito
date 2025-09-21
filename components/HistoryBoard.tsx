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
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-4 text-left transition transform hover:-translate-y-1 hover:border-brand-500/40 ${
                      isSelected ? 'border-brand-500/50 shadow-lg shadow-brand-500/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950" style={{ width: '96px', height: '64px' }}>
                        {item.videoUrl ? (
                          <video
                            src={item.videoUrl}
                            muted
                            playsInline
                            loop
                            className="absolute inset-0 h-full w-full object-contain bg-black"
                          />
                        ) : (
                          <img src={item.imagePreview} alt={item.prompt} className="absolute inset-0 h-full w-full object-contain bg-black" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-100 flex-1">
                              {item.prompt || 'Untitled prompt'}
                            </p>
                            <span className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${tone}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {item.status === 'pending' ? 'Rendering' : item.status === 'completed' ? 'Ready' : 'Failed'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[0.7rem] text-slate-500">
                            <span>{item.resolution}</span>
                            <span>•</span>
                            <span>{item.frames}f</span>
                            <span>•</span>
                            <span>{formatTimestamp(item.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-2 text-slate-400">
                          {item.status === 'completed' && item.videoUrl && (
                            <a
                              href={item.videoUrl}
                              download={`video-${item.id}.mp4`}
                              onClick={(event) => event.stopPropagation()}
                              className="rounded-full border border-slate-700/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide hover:border-brand-400 hover:text-brand-200"
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
                            className="rounded-full border border-danger-500/30 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-danger-200 hover:border-danger-400 hover:text-white"
                          >
                            {item.status === 'pending' ? 'Cancel' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </button>
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
