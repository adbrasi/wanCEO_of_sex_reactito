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
  outputs?: Array<{
    filename: string;
    data: string;
  }>;
  error?: string;
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
  seed: number
): Promise<string> {
  const workflow = await loadWorkflow();

  // Update workflow with seed for all seed nodes
  // Node 27 has the main seed
  if (workflow['27'] && workflow['27'].inputs) {
    workflow['27'].inputs.seed = seed;
  }
  // Node 90 also has a seed
  if (workflow['90'] && workflow['90'].inputs) {
    workflow['90'].inputs.seed = seed;
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

  const response = await fetch('/api/submit-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submission),
  });

  const data = await response.json();

  if (!data.job_id) {
    throw new Error(data.error || 'Failed to submit job - no job ID returned');
  }

  return data.job_id;
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

export async function pollJobCompletion(
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<JobStatus> {
  return new Promise((resolve, reject) => {
    // Don't even start polling if jobId is invalid
    if (!jobId || jobId === 'undefined') {
      reject(new Error('Invalid job ID - cannot poll for status'));
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    
    const interval = setInterval(async () => {
      try {
        const status = await checkJobStatus(jobId);

        // Reset retry count on successful request
        retryCount = 0;

        if (onProgress) {
          onProgress(status.progress);
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