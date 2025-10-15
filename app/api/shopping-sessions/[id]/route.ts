import { NextResponse } from 'next/server';
import {
  getShoppingSessionById,
  updateShoppingSession,
  deleteShoppingSession,
} from '@/lib/db-mongo';
import { updateShoppingSessionSchema } from '@/lib/validations-api';
import { withErrorHandling, logInfo, assertExists } from '@/lib/errors';
import { apiRateLimiter, getClientIdentifier, checkRateLimit } from '@/lib/rate-limiter';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(apiRateLimiter, clientId);

    const { id } = await params;
    const session = await getShoppingSessionById(id);
    assertExists(session, 'Session de courses', id);

    logInfo('Shopping session fetched', { sessionId: id });

    return session;
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
    const body = await request.json();
    const validatedData = updateShoppingSessionSchema.parse(body);

    const session = await updateShoppingSession(id, validatedData);
    assertExists(session, 'Session de courses', id);

    logInfo('Shopping session updated', { sessionId: id });

    return session;
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

    // Vérifier que la session existe avant de la supprimer
    const session = await getShoppingSessionById(id);
    assertExists(session, 'Session de courses', id);

    const success = await deleteShoppingSession(id);

    if (!success) {
      throw new Error('Impossible de supprimer la session');
    }

    logInfo('Shopping session deleted', { sessionId: id });

    return NextResponse.json({ success: true, message: 'Session supprimée' });
  });
}

