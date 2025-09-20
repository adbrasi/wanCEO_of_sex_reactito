'use client';

import { useState, useEffect, useRef } from 'react';
import { submitJob, pollJobCompletion } from '@/lib/api';
import {
  GenerationHistory,
  addToHistory,
  updateHistoryItem,
  getTodayHistory,
  getYesterdayHistory,
  createThumbnail,
  getHistory,
  saveHistory
} from '@/lib/storage';
import HistoryGallery from '@/components/HistoryGallery';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走');
  const [resolution, setResolution] = useState<'768x768' | '1024x1024'>('768x768');
  const [frames, setFrames] = useState(17); // Default to valid N*4+1 value
  const [batchSize, setBatchSize] = useState(1);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentProgressDetails, setCurrentProgressDetails] = useState<any>(null);
  const [todayHistory, setTodayHistory] = useState<GenerationHistory[]>([]);
  const [yesterdayHistory, setYesterdayHistory] = useState<GenerationHistory[]>([]);
  const [queuedJobs, setQueuedJobs] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate valid frame numbers (N*4+1)
  const validFrameNumbers = Array.from({ length: 50 }, (_, i) => i * 4 + 1).filter(n => n <= 200);

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayHistory(getTodayHistory());
      setYesterdayHistory(getYesterdayHistory());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateVideo = async () => {
    if (!selectedImage || !prompt) {
      alert('Please select an image and enter a prompt');
      return;
    }

    // If already generating, add to queue
    if (isGenerating) {
      setQueuedJobs(prev => prev + batchSize);
      return;
    }

    setIsGenerating(true);
    setCurrentProgress(0);

    try {
      const imageBase64 = await fileToBase64(selectedImage);
      const thumbnail = await createThumbnail(imageBase64);

      // Create all batch items at once for UI
      const historyItems: Array<{ id: string; seed: number }> = [];
      
      for (let i = 0; i < batchSize; i++) {
        // Generate unique seed for each batch item (1 to 999999)
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
          resolution,
          frames
        };

        addToHistory(historyItem);
        historyItems.push({ id: historyId, seed });
      }

      // Submit jobs with delay to avoid Modal file locking issues
      const batchPromises = [];
      
      for (let i = 0; i < historyItems.length; i++) {
        const { id: historyId, seed } = historyItems[i];
        
        // Add delay between submissions (except for first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const jobPromise = submitJob(
          imageBase64,
          prompt,
          negativePrompt,
          selectedImage.name,
          seed
        ).then(jobId => {
          updateHistoryItem(historyId, { jobId });

          // Poll for completion
          return pollJobCompletion(
            jobId,
            (progressInfo) => {
              setCurrentProgress(progressInfo.progress);
              setCurrentProgressDetails(progressInfo.details);
              updateHistoryItem(historyId, {
                progress: progressInfo.progress,
                progressDetails: progressInfo.details
              });
            }
          ).then((result) => {
            if (result.outputs && result.outputs.length > 0) {
              const videoData = result.outputs[0].data;
              const videoBlob = new Blob(
                [Uint8Array.from(atob(videoData), c => c.charCodeAt(0))],
                { type: 'video/mp4' }
              );
              const videoUrl = URL.createObjectURL(videoBlob);

              updateHistoryItem(historyId, {
                status: 'completed',
                videoUrl,
                progress: 100
              });
            }
          }).catch((error) => {
            console.error('Generation failed:', error);
            updateHistoryItem(historyId, {
              status: 'failed'
            });
          });
        }).catch(error => {
          console.error('Failed to submit job:', error);
          updateHistoryItem(historyId, {
            status: 'failed'
          });
        });

        batchPromises.push(jobPromise);
      }

      // Wait for all batch jobs to complete
      await Promise.allSettled(batchPromises);

      // Process queued jobs if any
      if (queuedJobs > 0) {
        const jobsToProcess = queuedJobs;
        setQueuedJobs(0);
        setBatchSize(jobsToProcess);
        // Recursively call generateVideo for queued jobs
        setTimeout(() => generateVideo(), 100);
      }
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
      setCurrentProgress(0);
      setCurrentProgressDetails(null);
    }
  };

  const deleteHistoryItem = (id: string) => {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    saveHistory(filtered);
    // Force update
    setTodayHistory(getTodayHistory());
    setYesterdayHistory(getYesterdayHistory());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-5xl font-bold mb-8 text-center text-gray-800">
          AI Video Generator
        </h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Image
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 hover:bg-blue-50"
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 w-auto mx-auto object-contain rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview('');
                        setSelectedImage(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 font-medium">Click to upload an image</p>
                    <p className="text-gray-400 text-sm mt-2">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Controls Section */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Animation Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the animation you want..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Negative Prompt
                </label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as '768x768' | '1024x1024')}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="768x768">768×768</option>
                    <option value="1024x1024">1024×1024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Frames (N*4+1)
                  </label>
                  <select
                    value={frames}
                    onChange={(e) => setFrames(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {validFrameNumbers.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batch Size
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateVideo}
                disabled={!selectedImage || !prompt}
                className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isGenerating ? (
                  <span className="flex flex-col items-center justify-center">
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating... {currentProgress}%
                      {queuedJobs > 0 && ` (${queuedJobs} queued)`}
                    </span>
                    {currentProgressDetails && (
                      <span className="text-xs mt-1 opacity-90">
                        {currentProgressDetails.step && `Step: ${currentProgressDetails.step}`}
                        {currentProgressDetails.nodes_completed !== undefined &&
                         currentProgressDetails.nodes_total !== undefined &&
                         ` | Node: ${currentProgressDetails.nodes_completed}/${currentProgressDetails.nodes_total}`}
                      </span>
                    )}
                  </span>
                ) : (
                  `Generate ${batchSize > 1 ? `${batchSize} Videos` : 'Video'}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Generation History</h2>

          <HistoryGallery items={todayHistory} title="Today" onDelete={deleteHistoryItem} />
          <HistoryGallery items={yesterdayHistory} title="Yesterday" onDelete={deleteHistoryItem} />

          {todayHistory.length === 0 && yesterdayHistory.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-32 h-32 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
              </svg>
              <p className="text-xl">No videos generated yet</p>
              <p className="text-gray-400 mt-2">Upload an image and enter a prompt to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}