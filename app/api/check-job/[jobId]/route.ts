import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://cezarsaint--comfyui-saas-api2full-api.modal.run';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const response = await fetch(`${API_URL}/v1/jobs/${jobId}`);
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