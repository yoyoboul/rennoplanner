import { NextResponse } from 'next/server';
import { getPurchaseById, updatePurchase, deletePurchase } from '@/lib/db-mongo';
import { updatePurchaseSchema } from '@/lib/validations-api';
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
    const purchase = await getPurchaseById(id);

    assertExists(purchase, 'Achat', id);

    return purchase;
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

    // Vérifier que l'achat existe
    const existingPurchase = await getPurchaseById(id);
    assertExists(existingPurchase, 'Achat', id);

    const body = await request.json();
    const validatedData = updatePurchaseSchema.parse(body);

    // Map item_name to name if present
    const updateData: any = { ...validatedData };
    if (updateData.item_name) {
      updateData.name = updateData.item_name;
      delete updateData.item_name;
    }

    const purchase = await updatePurchase(id, updateData);

    logInfo('Purchase updated', { purchaseId: id });

    return purchase;
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

    // Vérifier que l'achat existe
    const existingPurchase = await getPurchaseById(id);
    assertExists(existingPurchase, 'Achat', id);

    await deletePurchase(id);

    logInfo('Purchase deleted', { purchaseId: id });

    return { success: true };
  });
}