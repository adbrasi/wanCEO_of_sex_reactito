'use client';

import { useRef, useState, ChangeEvent, DragEvent } from 'react';

type ResolutionOption = 768 | 1024 | 1280;
type WorkflowType = 'loop' | 'notloop';
type AnimationMotion = 'None' | 'staticAnimation' | 'slowAnimation' | 'IntenseAnimation';

interface ControlPanelProps {
  prompt: string;
  negativePrompt: string;
  resolution: ResolutionOption;
  frames: number;
  batchSize: number;
  workflowType: WorkflowType;
  assistantHelp: boolean;
  concatText: string;
  llmHint: string;
  animationMotion: AnimationMotion;
  imagePreview: string;
  selectedImageName: string | null;
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string) => void;
  onResolutionChange: (value: ResolutionOption) => void;
  onFramesChange: (value: number) => void;
  onBatchSizeChange: (value: number) => void;
  onWorkflowTypeChange: (value: WorkflowType) => void;
  onAssistantHelpChange: (value: boolean) => void;
  onConcatTextChange: (value: string) => void;
  onLlmHintChange: (value: string) => void;
  onAnimationMotionChange: (value: AnimationMotion) => void;
  onImageSelected: (file: File) => void;
  onImageCleared: () => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

export default function ControlPanel({
  prompt,
  negativePrompt,
  resolution,
  frames,
  batchSize,
  workflowType,
  assistantHelp,
  concatText,
  llmHint,
  animationMotion,
  imagePreview,
  selectedImageName,
  onPromptChange,
  onNegativePromptChange,
  onResolutionChange,
  onFramesChange,
  onBatchSizeChange,
  onWorkflowTypeChange,
  onAssistantHelpChange,
  onConcatTextChange,
  onLlmHintChange,
  onAnimationMotionChange,
  onImageSelected,
  onImageCleared,
  onGenerate,
  canGenerate
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validFrameNumbers = [49, 57, 81];
  const resolutionOptions: ResolutionOption[] = [768, 1024, 1280];
  const animationOptions: AnimationMotion[] = ['None', 'staticAnimation', 'slowAnimation', 'IntenseAnimation'];

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <aside className="flex h-full flex-col gap-5 rounded-4xl border border-slate-800 bg-slate-950/85 p-6 shadow-[0_25px_65px_-35px_rgba(15,23,42,0.9)] backdrop-blur">
      <header className="flex justify-center">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`flex items-center gap-2 rounded-3xl px-6 py-3 text-sm font-semibold uppercase tracking-wide transition ${
            canGenerate
              ? 'bg-brand-500 text-white shadow-[0_20px_45px_-20px_rgba(99,102,241,0.8)] hover:bg-brand-400'
              : 'cursor-not-allowed bg-slate-800 text-slate-600'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          {`Render ${batchSize > 1 ? `${batchSize} Videos` : 'Video'}`}
        </button>
      </header>

      {/* Workflow Selection */}
      <section className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onWorkflowTypeChange('loop')}
            className={`flex-1 rounded-2xl border px-3 py-2 font-medium transition ${
              workflowType === 'loop'
                ? 'border-brand-500/60 bg-brand-500/20 text-brand-100'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-brand-500/40 hover:text-brand-100'
            }`}
          >
            Workflow 1 (Loop)
          </button>
          <button
            type="button"
            onClick={() => onWorkflowTypeChange('notloop')}
            className={`flex-1 rounded-2xl border px-3 py-2 font-medium transition ${
              workflowType === 'notloop'
                ? 'border-brand-500/60 bg-brand-500/20 text-brand-100'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-brand-500/40 hover:text-brand-100'
            }`}
          >
            Workflow 2 (Not Loop)
          </button>
        </div>
      </section>

      {/* Assistant Help Toggle */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assistant Help</label>
          <button
            type="button"
            onClick={() => onAssistantHelpChange(!assistantHelp)}
            className={`relative h-6 w-11 rounded-full transition ${
              assistantHelp ? 'bg-brand-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                assistantHelp ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Input Section - Modular design for future expansion */}
      <section className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Input Media</label>
        <div
          className={`mt-3 flex flex-col rounded-3xl border-2 border-dashed ${
            isDragging ? 'border-brand-500/60 bg-brand-500/10' : 'border-slate-800 bg-slate-900/60'
          } p-4 transition`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-slate-400 transition hover:border-brand-500/40 hover:text-brand-100"
          >
            {imagePreview ? (
              <div className="relative w-full overflow-hidden rounded-2xl">
                <img src={imagePreview} alt="Selected" className="w-full object-cover" />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl bg-slate-950/80 px-3 py-2 text-left text-xs text-slate-200">
                  <div className="truncate">{selectedImageName ?? 'Reference image'}</div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onImageCleared();
                    }}
                    className="rounded-full bg-white/10 p-1 text-slate-200 hover:bg-white/20"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid h-16 w-16 place-content-center rounded-full bg-slate-900 text-brand-300">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m6-6H6" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drop or browse an image</p>
                  <p className="mt-1 text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>
      </section>

      <section className="space-y-4">
        {/* Main prompt - only visible for non-LLM workflows */}
        {!assistantHelp && (
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Animation Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              rows={4}
              placeholder="Describe motion, camera, lighting..."
              className="w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200 shadow-inner focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        )}

        {/* LLM-specific inputs */}
        {assistantHelp && (
          <>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Concat Text
              </label>
              <input
                value={concatText}
                onChange={(event) => onConcatTextChange(event.target.value)}
                placeholder="Additional text to concatenate to prompt..."
                className="w-full rounded-3xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-200 shadow-inner focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Prompt Generator Hint
              </label>
              <textarea
                value={llmHint}
                onChange={(event) => onLlmHintChange(event.target.value)}
                rows={2}
                placeholder="Hints for the AI prompt generator..."
                className="w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200 shadow-inner focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Animation Motion
              </label>
              <div className="grid grid-cols-2 gap-2">
                {animationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onAnimationMotionChange(option)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                      animationMotion === option
                        ? 'border-brand-500/60 bg-brand-500/20 text-brand-100'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-brand-500/40 hover:text-brand-100'
                    }`}
                  >
                    {option === 'None' ? 'None' : option.replace('Animation', '')}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Negative Prompt
          </label>
          <textarea
            value={negativePrompt}
            onChange={(event) => onNegativePromptChange(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200 shadow-inner focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-200"
        >
          Advanced controls
          <svg
            className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAdvanced && (
          <div className="mt-4 max-h-[300px] space-y-4 overflow-y-auto text-sm text-slate-200">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resolution
              </label>
              <div className="grid grid-cols-3 gap-2">
                {resolutionOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onResolutionChange(value)}
                    className={`rounded-2xl border px-3 py-2 font-medium transition ${
                      resolution === value
                        ? 'border-brand-500/60 bg-brand-500/20 text-brand-100'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-brand-500/40 hover:text-brand-100'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Frames
              </label>
              <div className="grid grid-cols-3 gap-2">
                {validFrameNumbers.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onFramesChange(value)}
                    className={`rounded-2xl border px-3 py-2 font-medium transition ${
                      frames === value
                        ? 'border-brand-500/60 bg-brand-500/20 text-brand-100'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-brand-500/40 hover:text-brand-100'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Batch Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onBatchSizeChange(value)}
                    className={`rounded-2xl border px-2 py-2 font-semibold transition ${
                      batchSize === value
                        ? 'border-brand-500/60 bg-brand-500/20 text-brand-100'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-brand-500/40 hover:text-brand-100'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <p className="text-center text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">
        Autoplay enabled · seeds randomised
      </p>
    </aside>
  );
}