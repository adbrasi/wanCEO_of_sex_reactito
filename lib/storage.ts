export interface GenerationHistory {
  id: string;
  jobId: string;
  prompt: string;
  negativePrompt: string;
  imagePreview: string; // base64 thumbnail
  videoUrl?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  progress: number;
  progress_value?: number;
  progress_max?: number;
  nodes_done?: number;
  nodes_total?: number;
  current_node?: string;
  resolution: '768x768' | '1024x1024';
  frames: number;
}

export const HISTORY_UPDATED_EVENT = 'wan-history-updated';

const STORAGE_KEY = 'video_generation_history';

function notifyHistoryUpdate(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(HISTORY_UPDATED_EVENT));
}

export function getHistory(): GenerationHistory[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveHistory(history: GenerationHistory[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  notifyHistoryUpdate();
}

export function addToHistory(item: GenerationHistory): void {
  const history = getHistory();
  history.unshift(item);
  // Keep only last 50 items
  if (history.length > 50) {
    history.pop();
  }
  saveHistory(history);
}

export function updateHistoryItem(id: string, updates: Partial<GenerationHistory>): void {
  const history = getHistory();
  const index = history.findIndex(item => item.id === id);
  if (index !== -1) {
    history[index] = { ...history[index], ...updates };
    saveHistory(history);
  }
}

export function getTodayHistory(): GenerationHistory[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getHistory().filter(item => item.timestamp >= today.getTime());
}

export function getYesterdayHistory(): GenerationHistory[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return getHistory().filter(
    item => item.timestamp >= yesterday.getTime() && item.timestamp < today.getTime()
  );
}

export function createThumbnail(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const maxSize = 200;

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}
