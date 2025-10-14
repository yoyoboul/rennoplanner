import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getTaskById, updateTask } from '@/lib/db-mongo';
import { withErrorHandling } from '@/lib/errors';
import type { PhotoMetadata } from '@/lib/types-mongo';

// GET /api/tasks/:id/photos - Get all photos for a task
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid task ID');
    }

    const task = await getTaskById(id);

    if (!task) {
      throw new Error('Task not found');
    }

    return { photos: task.photos || [] };
  });
}

// POST /api/tasks/:id/photos - Add a photo to a task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid task ID');
    }

    const body = await request.json();
    const { photo }: { photo: PhotoMetadata } = body;

    if (!photo || !photo.id || !photo.url) {
      throw new Error('Invalid photo data');
    }

    // Get current task
    const currentTask = await getTaskById(id);
    
    if (!currentTask) {
      throw new Error('Task not found');
    }

    // Add photo to existing photos array
    const updatedPhotos = [...(currentTask.photos || []), photo];
    
    // Update task with new photos array
    const updatedTask = await updateTask(id, { photos: updatedPhotos });

    if (!updatedTask) {
      throw new Error('Failed to update task');
    }

    return {
      success: true,
      photo,
      total_photos: updatedTask.photos?.length || 0,
    };
  });
}

// DELETE /api/tasks/:id/photos - Delete a photo from a task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid task ID');
    }

    if (!photoId) {
      throw new Error('Photo ID is required');
    }

    // Get current task
    const currentTask = await getTaskById(id);
    
    if (!currentTask) {
      throw new Error('Task not found');
    }

    // Remove photo from photos array
    const updatedPhotos = (currentTask.photos || []).filter(photo => photo.id !== photoId);
    
    // Update task with filtered photos array
    const updatedTask = await updateTask(id, { photos: updatedPhotos });

    if (!updatedTask) {
      throw new Error('Failed to update task');
    }

    return {
      success: true,
      message: 'Photo deleted successfully',
    };
  });
}

// PATCH /api/tasks/:id/photos - Update photo caption
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await request.json();
    const { photoId, caption }: { photoId: string; caption: string } = body;

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid task ID');
    }

    if (!photoId) {
      throw new Error('Photo ID is required');
    }

    // Get current task
    const currentTask = await getTaskById(id);
    
    if (!currentTask) {
      throw new Error('Task not found');
    }

    // Update photo caption in photos array
    const updatedPhotos = (currentTask.photos || []).map(photo => 
      photo.id === photoId ? { ...photo, caption } : photo
    );
    
    // Update task with modified photos array
    const updatedTask = await updateTask(id, { photos: updatedPhotos });

    if (!updatedTask) {
      throw new Error('Failed to update task');
    }

    return {
      success: true,
      message: 'Photo caption updated',
    };
  });
}

