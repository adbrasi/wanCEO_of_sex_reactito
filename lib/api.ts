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

interface WorkflowNode {
  class_type?: string;
  inputs?: Record<string, unknown>;
}

function fixWorkflowPaths(workflow: Record<string, unknown>, apiKeys?: Record<string, string>): Record<string, unknown> {
  // Path mappings for models and loras
  const modelPathFixes: Record<string, string> = {
    'Wan2_2-I2V-A14B-HIGH_fp8_e5m2_scaled_KJ.safetensors': 'I2V/Wan2_2-I2V-A14B-HIGH_fp8_e5m2_scaled_KJ.safetensors',
    'Wan2_2-I2V-A14B-LOW_fp8_e5m2_scaled_KJ.safetensors': 'I2V/Wan2_2-I2V-A14B-LOW_fp8_e5m2_scaled_KJ.safetensors',
  };

  const loraPathFixes: Record<string, string> = {
    'Wan2.2-Lightning_I2V-A14B-4steps-lora_HIGH_fp16.safetensors': 'Wan22-Lightning/Wan2.2-Lightning_I2V-A14B-4steps-lora_HIGH_fp16.safetensors',
    'Wan2.2-Lightning_I2V-A14B-4steps-lora_LOW_fp16.safetensors': 'Wan22-Lightning/Wan2.2-Lightning_I2V-A14B-4steps-lora_LOW_fp16.safetensors',
    'ultimate_sex_000005500_high_noise.safetensors': 'ultimate_sex_000006500_high_noise.safetensors',
    'ultimate_sex_000005500_low_noise.safetensors': 'ultimate_sex_000006500_low_noise.safetensors',
  };

  const upscaleModelFixes: Record<string, string> = {
    '2x-AnimeSharpV2_MoSR_Soft.pth': 'anime/2x-AnimeSharpV2_MoSR_Soft.pth',
  };

  // Iterate through all nodes in the workflow
  for (const nodeId in workflow) {
    const node = workflow[nodeId] as WorkflowNode;

    if (node && typeof node === 'object' && node.inputs) {
      // Fix WanVideoModelLoader nodes
      if (node.class_type === 'WanVideoModelLoader' && node.inputs.model) {
        const model = node.inputs.model as string;
        if (modelPathFixes[model]) {
          node.inputs.model = modelPathFixes[model];
        }
      }

      // Fix WanVideoLoraSelect nodes
      if (node.class_type === 'WanVideoLoraSelect' && node.inputs.lora) {
        const lora = node.inputs.lora as string;
        if (loraPathFixes[lora]) {
          node.inputs.lora = loraPathFixes[lora];
        }
      }

      // Fix UpscaleModelLoader nodes
      if (node.class_type === 'UpscaleModelLoader' && node.inputs.model_name) {
        const modelName = node.inputs.model_name as string;
        if (upscaleModelFixes[modelName]) {
          node.inputs.model_name = upscaleModelFixes[modelName];
        }
      }

      // Inject API keys into GroqAPINode (node 113)
      if (node.class_type === 'GroqAPINode' && node.inputs) {
        if (node.inputs.api_key === 'YOUR_GROQ_API_KEY' && apiKeys?.groqApiKey) {
          node.inputs.api_key = apiKeys.groqApiKey;
        }
      }
    }
  }

  return workflow;
}

export async function loadWorkflow(workflowName: string) {
  const response = await fetch(`/workflows/${workflowName}`);
  let workflow = await response.json();

  // Auto-fix model and lora paths (API keys will be injected server-side)
  workflow = fixWorkflowPaths(workflow);

  return workflow;
}

export async function submitJob(
  imageBase64: string,
  prompt: string,
  negativePrompt: string,
  imageName: string,
  seed: number,
  frames: number = 49,
  resolution: number = 768,
  workflowType: 'loop' | 'notloop' = 'loop',
  assistantHelp: boolean = false,
  concatText?: string,
  llmHint?: string,
  animationMotion: 'None' | 'staticAnimation' | 'slowAnimation' | 'IntenseAnimation' = 'None'
): Promise<string> {
  // Determine workflow filename
  let workflowName: string;
  if (workflowType === 'loop') {
    workflowName = assistantHelp ? 'loop_Full_api_wf_kijalito.json' : 'loop_Full_withhouLLM_api_wf_kijalito.json';
  } else {
    workflowName = assistantHelp ? 'NOTloop_Full_api_wf_kijalito.json' : 'NOTloop_Full_withhouLLM_api_wf_kijalito.json';
  }

  const workflow = await loadWorkflow(workflowName);

  // Update workflow with seed (node 27 and possibly others)
  if (workflow['27'] && workflow['27'].inputs) {
    workflow['27'].inputs.seed = seed;
  }
  if (workflow['90'] && workflow['90'].inputs) {
    workflow['90'].inputs.seed = seed;
  }

  // Update frames in node 89
  if (workflow['89'] && workflow['89'].inputs) {
    workflow['89'].inputs.num_frames = frames;
  }

  // Update resolution in node 129
  if (workflow['129'] && workflow['129'].inputs) {
    workflow['129'].inputs.value = resolution;
  }

  // Update resolution in node 68 if it exists (for ImageResize compatibility)
  if (workflow['68'] && workflow['68'].inputs) {
    workflow['68'].inputs.width = resolution;
    workflow['68'].inputs.height = resolution;
  }

  // Update image filename in node 107
  if (workflow['107'] && workflow['107'].inputs) {
    workflow['107'].inputs.image = 'example.png';
  }

  // Handle LLM-specific inputs
  if (assistantHelp) {
    // Node 131: concat text
    if (workflow['131'] && workflow['131'].inputs && concatText) {
      workflow['131'].inputs.text = concatText;
    }

    // Node 134: LLM hint + animation motion
    if (workflow['134'] && workflow['134'].inputs) {
      let llmText = llmHint || '';
      if (animationMotion !== 'None') {
        llmText = animationMotion + (llmText ? ', ' + llmText : '');
      }
      workflow['134'].inputs.text = llmText;
    }

    // Set strength for nodes 99 and 100 if animation motion is not None
    if (animationMotion !== 'None') {
      if (workflow['99'] && workflow['99'].inputs) {
        workflow['99'].inputs.strength = 0.9;
      }
      if (workflow['100'] && workflow['100'].inputs) {
        workflow['100'].inputs.strength = 0.9;
      }
    }
  } else {
    // For workflows without LLM, node 134 is the main prompt input
    if (workflow['134'] && workflow['134'].inputs) {
      workflow['134'].inputs.text = prompt;
    }
  }

  // Prepare inputs array
  const inputs: WorkflowInput[] = [];
  
  // Only add prompt inputs for non-LLM workflows or when we have a prompt to send
  // For LLM workflows, the positive_prompt comes from the LLM output (node 121), not from user input
  if (!assistantHelp && workflow['16']) {
    inputs.push({
      node: "16",
      field: "positive_prompt",
      value: prompt,
      type: "raw"
    });
  }
  
  // Negative prompt is always sent
  if (workflow['16']) {
    inputs.push({
      node: "16", 
      field: "negative_prompt",
      value: negativePrompt,
      type: "raw"
    });
  }

  const submission: JobSubmission = {
    workflow,
    inputs,
    media: [
      {
        name: "example.png", // Changed to match node 107 expectation
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