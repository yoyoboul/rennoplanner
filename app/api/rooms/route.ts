import { NextResponse } from 'next/server';
import { getRoomsByProjectId, createRoom, getProjectById } from '@/lib/db-mongo';
import { createRoomSchema } from '@/lib/validations-api';
import { withErrorHandling, logInfo, assertExists } from '@/lib/errors';
import { apiRateLimiter, createRateLimiter, getClientIdentifier, checkRateLimit } from '@/lib/rate-limiter';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(apiRateLimiter, clientId);

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');

    if (!project_id) {
      return [];
    }

    // Vérifier que le projet existe
    const project = await getProjectById(project_id);
    assertExists(project, 'Projet', project_id);

    const rooms = await getRoomsByProjectId(project_id);

    logInfo('Rooms fetched', { projectId: project_id, count: rooms.length });

    return rooms;
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(createRateLimiter, clientId, 'Limite de création de pièces atteinte');

    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    const { project_id, name, description, surface_area, allocated_budget } = validatedData;

    // Vérifier que le projet existe
    const project = await getProjectById(project_id);
    assertExists(project, 'Projet', project_id);

    const room = await createRoom({
      project_id,
      name,
      description,
      surface_area,
      allocated_budget,
    });

    logInfo('Room created', { roomId: room.id, projectId: project_id, name });

    return NextResponse.json(room, { status: 201 });
  });
}