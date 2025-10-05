import { NextResponse } from 'next/server';
import { getPurchasesByProjectId, createPurchase, getProjectById, getRoomById, getTaskById } from '@/lib/db-mongo';
import { createPurchaseSchema } from '@/lib/validations-api';
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

    const purchases = await getPurchasesByProjectId(project_id);

    logInfo('Purchases fetched', { projectId: project_id, count: purchases.length });

    return purchases;
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const clientId = getClientIdentifier(request);
    checkRateLimit(createRateLimiter, clientId, 'Limite de création d\'achats atteinte');

    const body = await request.json();
    const validatedData = createPurchaseSchema.parse(body);

    const {
      project_id,
      room_id,
      task_id,
      item_name,
    } = validatedData;

    // Vérifier que le projet existe
    const project = await getProjectById(project_id);
    assertExists(project, 'Projet', project_id);

    // Vérifier que la pièce existe si spécifiée
    if (room_id) {
      const room = await getRoomById(room_id);
      assertExists(room, 'Pièce', room_id);
    }

    // Vérifier que la tâche existe si spécifiée
    if (task_id) {
      const task = await getTaskById(task_id);
      assertExists(task, 'Tâche', task_id);
    }

    const purchase = await createPurchase({
      ...validatedData,
      name: item_name, // Map item_name to name
    });

    logInfo('Purchase created', { purchaseId: purchase.id, projectId: project_id, item: item_name });

    return NextResponse.json(purchase, { status: 201 });
  });
}