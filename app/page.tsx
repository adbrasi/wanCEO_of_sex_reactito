'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ControlPanel from '@/components/ControlPanel';
import HistoryWorkspace from '@/components/HistoryWorkspace';
import HistoryBoard from '@/components/HistoryBoard';
import { submitJob, pollJobCompletion } from '@/lib/api';
import {
  GenerationHistory,
  addToHistory,
  updateHistoryItem,
  getTodayHistory,
  getYesterdayHistory,
  createThumbnail,
  getHistory,
  saveHistory,
  HISTORY_UPDATED_EVENT
} from '@/lib/storage';

const DEFAULT_NEGATIVE_PROMPT =
  '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [resolution, setResolution] = useState<768 | 1024 | 1280>(768);
  const [frames, setFrames] = useState(49);
  const [batchSize, setBatchSize] = useState(1);
  const [workflowType, setWorkflowType] = useState<'loop' | 'notloop'>('loop');
  const [assistantHelp, setAssistantHelp] = useState(false);
  const [concatText, setConcatText] = useState('');
  const [llmHint, setLlmHint] = useState('');
  const [animationMotion, setAnimationMotion] = useState<'None' | 'staticAnimation' | 'slowAnimation' | 'IntenseAnimation'>('None');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [todayHistory, setTodayHistory] = useState<GenerationHistory[]>([]);
  const [yesterdayHistory, setYesterdayHistory] = useState<GenerationHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const activeJobsRef = useRef(0);

  const validFrameNumbers = [49, 57, 81];

  const combinedHistory = useMemo(
    () => [...todayHistory, ...yesterdayHistory],
    [todayHistory, yesterdayHistory]
  );

  const selectedItem = useMemo(() => {
    if (!combinedHistory.length) return null;
    if (selectedHistoryId) {
      const current = combinedHistory.find((item) => item.id === selectedHistoryId);
      if (current) return current;
    }
    return combinedHistory[0];
  }, [combinedHistory, selectedHistoryId]);


  const syncHistory = useCallback(() => {
    setTodayHistory(getTodayHistory());
    setYesterdayHistory(getYesterdayHistory());
  }, []);

  useEffect(() => {
    syncHistory();

    const handleHistoryUpdate = () => syncHistory();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'video_generation_history') {
        syncHistory();
      }
    };

    window.addEventListener(HISTORY_UPDATED_EVENT, handleHistoryUpdate as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, handleHistoryUpdate as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [syncHistory]);

  useEffect(() => {
    if (!combinedHistory.length) {
      setSelectedHistoryId(null);
      return;
    }

    setSelectedHistoryId((prev) => {
      if (prev && combinedHistory.some((item) => item.id === prev)) {
        return prev;
      }
      return combinedHistory[0].id;
    });
  }, [combinedHistory]);

  const handleImageSelected = useCallback((file: File) => {
    setSelectedImage(file);
    setSelectedImageName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageCleared = useCallback(() => {
    setSelectedImage(null);
    setSelectedImageName(null);
    setImagePreview('');
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/cancel-job/${jobId}`, { method: 'DELETE' });
      if (response.ok) {
        const history = getHistory();
        const item = history.find((entry) => entry.jobId === jobId);
        if (item) {
          updateHistoryItem(item.id, { status: 'failed' });

          // Auto-delete failed items after 20 seconds
          setTimeout(() => {
            deleteHistoryItem(item.id);
          }, 20000);
        }
      } else {
        console.error(`Failed to cancel job ${jobId}: ${response.status}`);
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  const generateVideo = async () => {
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }
    if (!assistantHelp && !prompt) {
      alert('Please enter a prompt');
      return;
    }

    try {
      const imageBase64 = await fileToBase64(selectedImage);
      const thumbnail = await createThumbnail(imageBase64);

      activeJobsRef.current += batchSize;

      const historyItems: Array<{ id: string; seed: number }> = [];

      for (let i = 0; i < batchSize; i++) {
        const seed = Math.floor(Math.random() * 999999) + 1;
        const historyId = `${Date.now()}-${i}`;

        const historyItem: GenerationHistory = {
          id: historyId,
          jobId: '',
          prompt,
          negativePrompt,
          imagePreview: thumbnail,
          status: 'pending',
          timestamp: Date.now(),
          progress: 0,
          resolution: `${resolution}x${resolution}`,
          frames
        };

        addToHistory(historyItem);
        historyItems.push({ id: historyId, seed });
      }

      const batchPromises: Promise<void>[] = [];

      for (let i = 0; i < historyItems.length; i++) {
        const { id: historyId, seed } = historyItems[i];
        const currentJobIndex = activeJobsRef.current + i;
        const isLikelyQueued = currentJobIndex >= 4;

        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const jobPromise = submitJob(
          imageBase64,
          prompt,
          negativePrompt,
          selectedImage.name,
          seed,
          frames,
          resolution,
          workflowType,
          assistantHelp,
          concatText,
          llmHint,
          animationMotion
        )
          .then((jobId) => {
            updateHistoryItem(historyId, { jobId });

            return pollJobCompletion(
              jobId,
              (progressInfo) => {
                updateHistoryItem(historyId, {
                  progress: progressInfo.progress,
                  progress_value: progressInfo.progress_value,
                  progress_max: progressInfo.progress_max,
                  nodes_done: progressInfo.nodes_done,
                  nodes_total: progressInfo.nodes_total,
                  current_node: progressInfo.current_node
                });
              },
              isLikelyQueued
            ).then((result) => {
              activeJobsRef.current = Math.max(0, activeJobsRef.current - 1);

              if (result.outputs && result.outputs.length > 0) {
                // Log all outputs to see what's available
                console.log('Available outputs:', result.outputs.map((o: any) => ({
                  filename: o.filename,
                  type: o.type,
                  size: o.size_bytes
                })));

                // Priority order: AnimateDiff > last video > first video
                let outputToUse = result.outputs.find((o: any) =>
                  o.filename && o.filename.includes('AnimateDiff')
                );

                if (!outputToUse) {
                  // If no AnimateDiff found, get the last video file (usually the most processed)
                  outputToUse = result.outputs[result.outputs.length - 1];
                }

                console.log('Selected output:', outputToUse.filename || 'unknown');

                const videoData = outputToUse.data;
                const videoBlob = new Blob(
                  [Uint8Array.from(atob(videoData), (c) => c.charCodeAt(0))],
                  { type: 'video/mp4' }
                );
                const videoUrl = URL.createObjectURL(videoBlob);

                updateHistoryItem(historyId, {
                  videoUrl,
                  status: 'completed',
                  progress: 100,
                  progress_value: undefined,
                  progress_max: undefined,
                  nodes_done: undefined,
                  nodes_total: undefined,
                  current_node: undefined
                });
              } else {
                throw new Error('No video output in response');
              }
            });
          })
          .catch((error) => {
            activeJobsRef.current = Math.max(0, activeJobsRef.current - 1);
            console.error(`Error processing job for history ${historyId}:`, error);
            updateHistoryItem(historyId, { status: 'failed' });

            // Auto-delete failed items after 20 seconds
            setTimeout(() => {
              deleteHistoryItem(historyId);
            }, 20000);
          });

        batchPromises.push(jobPromise);
      }

      await Promise.allSettled(batchPromises);
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Failed to generate video. Please try again.');
    }
  };

  const deleteHistoryItem = (id: string) => {
    const history = getHistory();
    const filtered = history.filter((item) => item.id !== id);
    saveHistory(filtered);
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
    }
    syncHistory();
  };


  const sections = useMemo(
    () => [
      { title: 'Today', items: todayHistory },
      { title: 'Yesterday', items: yesterdayHistory }
    ],
    [todayHistory, yesterdayHistory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col gap-6 px-6 py-6 xl:px-12">
        <main className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <ControlPanel
            prompt={prompt}
            negativePrompt={negativePrompt}
            resolution={resolution}
            frames={frames}
            batchSize={batchSize}
            workflowType={workflowType}
            assistantHelp={assistantHelp}
            concatText={concatText}
            llmHint={llmHint}
            animationMotion={animationMotion}
            imagePreview={imagePreview}
            selectedImageName={selectedImageName}
            onPromptChange={setPrompt}
            onNegativePromptChange={setNegativePrompt}
            onResolutionChange={setResolution}
            onFramesChange={setFrames}
            onBatchSizeChange={setBatchSize}
            onWorkflowTypeChange={setWorkflowType}
            onAssistantHelpChange={setAssistantHelp}
            onConcatTextChange={setConcatText}
            onLlmHintChange={setLlmHint}
            onAnimationMotionChange={setAnimationMotion}
            onImageSelected={handleImageSelected}
            onImageCleared={handleImageCleared}
            onGenerate={generateVideo}
            canGenerate={Boolean(selectedImage && (prompt || assistantHelp))}
          />

          <HistoryWorkspace
            item={selectedItem}
            onDeleteItem={deleteHistoryItem}
            onCancelJob={cancelJob}
          />

          <HistoryBoard
            sections={sections}
            selectedId={selectedHistoryId}
            onSelect={(item) => setSelectedHistoryId(item.id)}
            onDelete={deleteHistoryItem}
            onCancel={cancelJob}
          />
        </main>
      </div>
    </div>
  );
}
