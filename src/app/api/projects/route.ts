import { NextRequest, NextResponse } from 'next/server';
import { generateCommercialVideoProject } from '@/lib/engine/pipeline-orchestrator';
import { INITIAL_PROJECTS } from '@/lib/store/video-store';

let projectsStore = [...INITIAL_PROJECTS];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: projectsStore.length,
    projects: projectsStore
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newProject = generateCommercialVideoProject(body);
    projectsStore.unshift(newProject);

    return NextResponse.json({
      success: true,
      project: newProject
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: 'GENERATION_ERROR',
      message: err.message
    }, { status: 400 });
  }
}
