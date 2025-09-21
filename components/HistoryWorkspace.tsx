'use client';

import VideoPlayer from './VideoPlayer';
import { GenerationHistory } from '@/lib/storage';

interface HistoryWorkspaceProps {
  item: GenerationHistory | null;
  onDeleteItem: (id: string) => void;
  onCancelJob?: (jobId: string) => void;
}

const STATUS_BADGES: Record<GenerationHistory['status'], { label: string; tone: string }> = {
  pending: { label: 'Rendering', tone: 'bg-brand-500/10 text-brand-200 border border-brand-500/40' },
  completed: { label: 'Ready', tone: 'bg-accent-500/10 text-accent-200 border border-accent-500/30' },
  failed: { label: 'Failed', tone: 'bg-danger-500/10 text-danger-200 border border-danger-500/40' }
};

export default function HistoryWorkspace({ item, onDeleteItem, onCancelJob }: HistoryWorkspaceProps) {
  if (!item) {
    return (
      <section className="flex h-full flex-col items-center justify-center rounded-4xl border border-slate-700/50 bg-slate-900/70 p-12 text-center text-slate-400 shadow-[0_25px_65px_-30px_rgba(15,23,42,0.9)]">
        <div className="grid h-20 w-20 place-content-center rounded-full bg-slate-800 text-brand-400">
          <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-white">No render selected</h2>
        <p className="mt-3 max-w-md text-sm text-slate-400">
          Start a job from the left panel or pick a render from your timeline to preview it full size.
        </p>
      </section>
    );
  }

  const badge = STATUS_BADGES[item.status];
  const formattedTime = new Date(item.timestamp).toLocaleString();

  return (
    <section className="flex h-full flex-col gap-6 rounded-4xl border border-slate-700/50 bg-[#0f172a]/80 p-6 shadow-[0_35px_70px_-40px_rgba(8,47,73,0.9)] backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">Now Playing</p>
          <h1 className="text-2xl font-semibold text-white leading-tight">
            {item.prompt || 'Untitled prompt'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
            <span>{item.resolution}</span>
            <span>•</span>
            <span>{item.frames} frames</span>
            <span>•</span>
            <span>{formattedTime}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
            {badge.label}
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-700/60 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 hover:border-brand-500/50 hover:text-brand-100"
            onClick={() => onDeleteItem(item.id)}
          >
            Remove
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-4xl border border-slate-800 bg-black/70">
        <VideoPlayer item={item} variant="inline" className="rounded-3xl" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
          <header className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Prompt</span>
          </header>
          <p className="whitespace-pre-line text-slate-200">{item.prompt}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
          <header className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Negative Prompt</span>
            <span className="text-[0.65rem] text-slate-600">Optimising quality</span>
          </header>
          <p className="whitespace-pre-line text-slate-400">{item.negativePrompt}</p>
        </section>
      </div>

      {item.status === 'pending' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-brand-500/30 bg-brand-500/10 px-5 py-4 text-xs font-semibold text-brand-100">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-300" />
            {item.current_node ? `Processing: ${item.current_node}` : 'Queued for rendering'}
          </div>
          {onCancelJob && item.jobId && (
            <button
              type="button"
              className="rounded-full border border-brand-500/40 px-4 py-2 text-[0.7rem] uppercase tracking-wide text-brand-100 hover:border-brand-300 hover:text-white"
              onClick={async () => {
                await onCancelJob(item.jobId);
                onDeleteItem(item.id);
              }}
            >
              Cancel Job
            </button>
          )}
        </div>
      )}
    </section>
  );
}
