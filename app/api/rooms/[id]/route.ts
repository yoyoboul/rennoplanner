import { NextResponse } from 'next/server';
import { getRoomById, updateRoom, deleteRoom } from '@/lib/db-mongo';
import { updateRoomSchema } from '@/lib/validations-api';
import { withErrorHandling, assertExists, logInfo } from '@/lib/errors';
import { apiRateLimiter, getClientIdentifier, checkRateLimit } from '@/lib/rate-limiter';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(apiRateLimiter, clientId);

    const { id } = await params;
    const room = await getRoomById(id);

    assertExists(room, 'Pièce', id);

    return room;
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(apiRateLimiter, clientId);

    const { id } = await params;

    // Vérifier que la pièce existe
    const existingRoom = await getRoomById(id);
    assertExists(existingRoom, 'Pièce', id);

    const body = await request.json();
    const validatedData = updateRoomSchema.parse(body);

    const room = await updateRoom(id, validatedData);

    logInfo('Room updated', { roomId: id });

    return room;
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(apiRateLimiter, clientId);

    const { id } = await params;

    // Vérifier que la pièce existe
    const existingRoom = await getRoomById(id);
    assertExists(existingRoom, 'Pièce', id);

    await deleteRoom(id);

    logInfo('Room deleted', { roomId: id });

    return { success: true };
  });
}