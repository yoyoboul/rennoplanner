import { NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@/lib/db-mongo';
import { updateProjectSchema } from '@/lib/validations-api';
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
    const project = await getProjectById(id);

    assertExists(project, 'Projet', id);

    // Calculate stats
    const allTasks = project.rooms.flatMap(r => r.tasks);
    const stats = {
      total_tasks: allTasks.length,
      completed_tasks: allTasks.filter(t => t.status === 'completed').length,
      total_spent: allTasks.reduce((sum, t) => sum + (parseFloat(t.actual_cost?.toString() || '0')), 0),
    };

    return {
      ...project,
      ...stats,
    };
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
    
    // Vérifier que le projet existe
    const existingProject = await getProjectById(id);
    assertExists(existingProject, 'Projet', id);

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const project = await updateProject(id, validatedData);

    logInfo('Project updated', { projectId: id });

    return project;
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

    // Vérifier que le projet existe
    const existingProject = await getProjectById(id);
    assertExists(existingProject, 'Projet', id);

    await deleteProject(id);

    logInfo('Project deleted', { projectId: id });

    return { success: true };
  });
}