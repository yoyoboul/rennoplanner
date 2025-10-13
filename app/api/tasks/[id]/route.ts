import { getTaskById, updateTask, deleteTask } from '@/lib/db-mongo';
import { updateTaskSchema } from '@/lib/validations-api';
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
    const task = await getTaskById(id);

    assertExists(task, 'Tâche', id);

    return task;
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

    // Vérifier que la tâche existe
    const existingTask = await getTaskById(id);
    assertExists(existingTask, 'Tâche', id);

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Remove null values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([, v]) => v !== null)
    );

    const task = await updateTask(id, updateData);

    logInfo('Task updated', { taskId: id });

    return task;
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

    // Vérifier que la tâche existe
    const existingTask = await getTaskById(id);
    assertExists(existingTask, 'Tâche', id);

    await deleteTask(id);

    logInfo('Task deleted', { taskId: id });

    return { success: true };
  });
}