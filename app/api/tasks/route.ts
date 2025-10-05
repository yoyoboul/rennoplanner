import { NextResponse } from 'next/server';
import { getTasksByRoomId, createTask, getRoomById } from '@/lib/db-mongo';
import { createTaskSchema } from '@/lib/validations-api';
import { withErrorHandling, logInfo, assertExists } from '@/lib/errors';
import { apiRateLimiter, createRateLimiter, getClientIdentifier, checkRateLimit } from '@/lib/rate-limiter';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(apiRateLimiter, clientId);

    const { searchParams } = new URL(request.url);
    const room_id = searchParams.get('room_id');

    if (!room_id) {
      return [];
    }

    // Vérifier que la pièce existe
    const room = await getRoomById(room_id);
    assertExists(room, 'Pièce', room_id);

    const tasks = await getTasksByRoomId(room_id);

    logInfo('Tasks fetched', { roomId: room_id, count: tasks.length });

    return tasks;
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(createRateLimiter, clientId, 'Limite de création de tâches atteinte');

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Vérifier que la pièce existe
    const room = await getRoomById(validatedData.room_id.toString());
    assertExists(room, 'Pièce', validatedData.room_id.toString());

    const task = await createTask({
      ...validatedData,
      room_id: validatedData.room_id.toString(),
      dependencies: validatedData.dependencies ? [validatedData.dependencies] : undefined,
    });

    logInfo('Task created', { taskId: task.id, roomId: validatedData.room_id, title: validatedData.title });

    return NextResponse.json(task, { status: 201 });
  });
}