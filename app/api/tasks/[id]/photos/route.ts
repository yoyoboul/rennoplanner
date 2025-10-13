import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getTasksCollection, getRoomsCollection, getProjectsCollection } from '@/lib/mongodb';
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

    const tasksCollection = await getTasksCollection();
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });

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

    const tasksCollection = await getTasksCollection();
    
    // Add photo to task's photos array
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { photos: photo },
        $set: { updated_at: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Task not found');
    }

    // Get updated task
    const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(id) });

    return {
      success: true,
      photo,
      total_photos: updatedTask?.photos?.length || 0,
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

    const tasksCollection = await getTasksCollection();

    // Remove photo from task's photos array
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { photos: { id: photoId } },
        $set: { updated_at: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Task not found');
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

    const tasksCollection = await getTasksCollection();

    // Update photo caption
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id), 'photos.id': photoId },
      {
        $set: {
          'photos.$.caption': caption,
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Task or photo not found');
    }

    return {
      success: true,
      message: 'Photo caption updated',
    };
  });
}

