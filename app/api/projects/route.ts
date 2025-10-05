import { NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/lib/db-mongo';
import { createProjectSchema } from '@/lib/validations-api';
import { withErrorHandling, logInfo } from '@/lib/errors';
import { apiRateLimiter, createRateLimiter, getClientIdentifier, checkRateLimit } from '@/lib/rate-limiter';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(apiRateLimiter, clientId);

    const projects = await getAllProjects();
    
    logInfo('Projects fetched', { count: projects.length });
    
    return projects;
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(createRateLimiter, clientId, 'Limite de création de projets atteinte');

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const { name, description, total_budget = 0 } = validatedData;

    const project = await createProject({
      name,
      description,
      total_budget,
    });
    
    logInfo('Project created', { projectId: project.id, name });
    
    return NextResponse.json(project, { status: 201 });
  });
}