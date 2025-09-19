import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://cezarsaint--comfyui-saas-api-api.modal.run';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const response = await fetch(`${API_URL}/v1/jobs/${params.jobId}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking job:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}