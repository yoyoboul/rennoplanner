/**
 * File Storage System for Task Photos
 * Supports base64 storage in MongoDB (for small images < 1MB)
 * Can be easily adapted to cloud storage (Cloudinary, AWS S3, Vercel Blob)
 */

import { nanoid } from 'nanoid';

export interface PhotoMetadata {
  id: string;
  url: string; // base64 data URL or cloud URL
  caption?: string;
  uploaded_at: string;
  uploaded_by?: string;
  size: number; // in bytes
  mimeType: string;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit for base64
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non supporté. Utilisez: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille max: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Convert File to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload photo and return metadata
 * Currently stores as base64, but can be adapted to cloud storage
 */
export async function uploadPhoto(
  file: File,
  options?: {
    caption?: string;
    uploaded_by?: string;
  }
): Promise<PhotoMetadata> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Convert to base64
  const dataUrl = await fileToBase64(file);

  // Create metadata
  const photo: PhotoMetadata = {
    id: nanoid(),
    url: dataUrl,
    caption: options?.caption,
    uploaded_at: new Date().toISOString(),
    uploaded_by: options?.uploaded_by,
    size: file.size,
    mimeType: file.type,
  };

  return photo;
}

/**
 * Get photo by ID from array
 */
export function getPhotoById(photos: PhotoMetadata[], photoId: string): PhotoMetadata | null {
  return photos.find((p) => p.id === photoId) || null;
}

/**
 * Delete photo from array
 */
export function deletePhoto(photos: PhotoMetadata[], photoId: string): PhotoMetadata[] {
  return photos.filter((p) => p.id !== photoId);
}

/**
 * Compress image if too large (client-side)
 * Returns a new File with compressed data
 */
export async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Get thumbnail URL (for now, same as original, but can be adapted to generate thumbnails)
 */
export function getThumbnailUrl(photo: PhotoMetadata): string {
  return photo.url;
}

// Future: Cloud storage adapters
// export async function uploadToCloudinary(file: File): Promise<string> { ... }
// export async function uploadToS3(file: File): Promise<string> { ... }
// export async function uploadToVercelBlob(file: File): Promise<string> { ... }

