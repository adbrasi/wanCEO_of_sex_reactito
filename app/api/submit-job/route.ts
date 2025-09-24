import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://cezarsaint--comfyui-saas-api2full-api.modal.run';

function injectApiKeys(workflow: Record<string, any>): Record<string, any> {
  // Inject API keys into workflow nodes
  for (const nodeId in workflow) {
    const node = workflow[nodeId];

    if (node && typeof node === 'object' && node.inputs) {
      // Inject Groq API key into GroqAPINode (node 113)
      if (node.class_type === 'GroqAPINode' && node.inputs) {
        if (node.inputs.api_key === 'YOUR_GROQ_API_KEY') {
          const groqApiKey = process.env.GROQ_API_KEY;
          if (groqApiKey) {
            node.inputs.api_key = groqApiKey;
          } else {
            console.warn('GROQ_API_KEY not found in environment variables');
          }
        }
      }
    }
  }

  return workflow;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Inject API keys into the workflow before sending to the API
    if (body.workflow) {
      body.workflow = injectApiKeys(body.workflow);
    }

    const response = await fetch(`${API_URL}/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error submitting job:', error);
    return NextResponse.json(
      { error: 'Failed to submit job' },
      { status: 500 }
    );
  }
}