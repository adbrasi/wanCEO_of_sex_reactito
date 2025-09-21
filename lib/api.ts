interface WorkflowInput {
  node: string;
  field: string;
  value: string | number;
  type?: string;
}

interface MediaInput {
  name: string;
  data: string;
}

interface JobSubmission {
  workflow: Record<string, unknown>;
  inputs: WorkflowInput[];
  media: MediaInput[];
  priority?: number;
}

interface JobStatus {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  progress_value?: number;
  progress_max?: number;
  nodes_total?: number;
  nodes_done?: number;
  current_node?: string;
  prompt_id?: string;
  last_event_time?: string;
  outputs?: Array<{
    filename: string;
    data: string;
    type?: string;
    size_bytes?: number;
  }>;
  error?: string;
  error_log_tail?: string[];
}

export async function loadWorkflow() {
  const response = await fetch('/workflows/wan22Smoothloop_fixed.json');
  return response.json();
}

export async function submitJob(
  imageBase64: string,
  prompt: string,
  negativePrompt: string,
  imageName: string,
  seed: number,
  frames: number = 49,
  resolution: string = '768x768'
): Promise<string> {
  const workflow = await loadWorkflow();

  // Parse resolution
  const [width, height] = resolution.split('x').map(n => parseInt(n));

  // Update workflow with seed for all seed nodes
  // Node 27 has the main seed
  if (workflow['27'] && workflow['27'].inputs) {
    workflow['27'].inputs.seed = seed;
  }
  // Node 90 also has a seed
  if (workflow['90'] && workflow['90'].inputs) {
    workflow['90'].inputs.seed = seed;
  }

  // Update frames in node 89
  if (workflow['89'] && workflow['89'].inputs) {
    workflow['89'].inputs.num_frames = frames;
  }

  // Update resolution in node 68 (ImageResize)
  if (workflow['68'] && workflow['68'].inputs) {
    workflow['68'].inputs.width = width;
    workflow['68'].inputs.height = height;
  }

  const submission: JobSubmission = {
    workflow,
    inputs: [
      {
        node: "16",
        field: "positive_prompt",
        value: prompt,
        type: "raw"
      },
      {
        node: "16",
        field: "negative_prompt",
        value: negativePrompt,
        type: "raw"
      }
    ],
    media: [
      {
        name: "image.jpg", // Always use image.jpg as the workflow expects
        data: imageBase64
      }
    ],
    priority: 1
  };

  try {
    const response = await fetch('/api/submit-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.job_id) {
      throw new Error(data.error || 'Failed to submit job - no job ID returned');
    }

    return data.job_id;
  } catch (error) {
    console.error('Error submitting job:', error);
    throw error;
  }
}

export async function checkJobStatus(jobId: string): Promise<JobStatus> {
  if (!jobId || jobId === 'undefined') {
    throw new Error('Invalid job ID');
  }
  
  const response = await fetch(`/api/check-job/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to check job status: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export interface ProgressInfo {
  progress: number;
  progress_value?: number;
  progress_max?: number;
  nodes_done?: number;
  nodes_total?: number;
  current_node?: string;
}

export async function pollJobCompletion(
  jobId: string,
  onProgress?: (info: ProgressInfo) => void,
  isLikelyQueued: boolean = false
): Promise<JobStatus> {
  return new Promise((resolve, reject) => {
    // Don't even start polling if jobId is invalid
    if (!jobId || jobId === 'undefined') {
      reject(new Error('Invalid job ID - cannot poll for status'));
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let hasStartedProcessing = false;
    let queuedTime = 0;
    const maxQueueTime = 600000; // 10 minutes max queue time

    const interval = setInterval(async () => {
      try {
        const status = await checkJobStatus(jobId);

        // Reset retry count on successful request
        retryCount = 0;

        // Track if job has started processing
        if (status.status === 'running' && !hasStartedProcessing) {
          hasStartedProcessing = true;
          console.log(`Job ${jobId} started processing after ${queuedTime/1000}s in queue`);
        }

        // Track queue time for jobs that might be queued
        if (status.status === 'queued' && isLikelyQueued) {
          queuedTime += 3000;
          if (queuedTime > maxQueueTime) {
            clearInterval(interval);
            reject(new Error('Job stuck in queue for too long'));
            return;
          }
        }

        if (onProgress) {
          onProgress({
            progress: status.progress || 0,
            progress_value: status.progress_value,
            progress_max: status.progress_max,
            nodes_done: status.nodes_done,
            nodes_total: status.nodes_total,
            current_node: status.current_node
          });
        }

        if (status.status === 'completed') {
          clearInterval(interval);
          resolve(status);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          reject(new Error(status.error || 'Job failed'));
        }
      } catch (error) {
        retryCount++;
        console.error(`Polling attempt ${retryCount} failed:`, error);

        if (retryCount >= maxRetries) {
          clearInterval(interval);
          reject(new Error(`Failed to check job status after ${maxRetries} retries`));
        }
      }
    }, 3000);
  });
}