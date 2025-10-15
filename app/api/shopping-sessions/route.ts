import { NextResponse } from 'next/server';
import {
  getShoppingSessionsByProjectId,
  createShoppingSession,
  getProjectById,
} from '@/lib/db-mongo';
import { createShoppingSessionSchema } from '@/lib/validations-api';
import { withErrorHandling, logInfo, assertExists } from '@/lib/errors';
import { apiRateLimiter, createRateLimiter, getClientIdentifier, checkRateLimit } from '@/lib/rate-limiter';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(apiRateLimiter, clientId);

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');

    if (!project_id) {
      throw new Error('project_id requis');
    }

    // Vérifier que le projet existe
    const project = await getProjectById(project_id);
    assertExists(project, 'Projet', project_id);

    const sessions = await getShoppingSessionsByProjectId(project_id);

    logInfo('Shopping sessions fetched', { projectId: project_id, count: sessions.length });

    return sessions;
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(createRateLimiter, clientId, 'Limite de création de sessions atteinte');

    const body = await request.json();
    const validatedData = createShoppingSessionSchema.parse(body);

    const { project_id } = validatedData;

    // Vérifier que le projet existe
    const project = await getProjectById(project_id);
    assertExists(project, 'Projet', project_id);

    const session = await createShoppingSession({
      project_id,
      date: validatedData.date,
      name: validatedData.name,
      notes: validatedData.notes,
    });

    logInfo('Shopping session created', { 
      sessionId: session.id, 
      projectId: project_id, 
      date: session.date 
    });

    return NextResponse.json(session, { status: 201 });
  });
}

