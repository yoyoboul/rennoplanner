'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, ImagePlus, Edit2, Trash2 } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  uploadPhoto,
  validateImageFile,
  compressImage,
  type PhotoMetadata,
} from '@/lib/file-storage';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface TaskPhotoGalleryProps {
  taskId: string;
  photos: PhotoMetadata[];
  onPhotosChange?: (photos: PhotoMetadata[]) => void;
  readOnly?: boolean;
}

export function TaskPhotoGallery({
  taskId,
  photos = [],
  onPhotosChange,
  readOnly = false,
}: TaskPhotoGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          alert(validation.error);
          continue;
        }

        // Compress if needed
        const compressedFile = file.size > 500 * 1024 ? await compressImage(file) : file;

        // Upload photo
        const photo = await uploadPhoto(compressedFile);

        // Call API to save photo
        const response = await fetch(`/api/tasks/${taskId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload photo');
        }

        // Update local state
        if (onPhotosChange) {
          onPhotosChange([...photos, photo]);
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Supprimer cette photo ?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/photos?photoId=${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      // Update local state
      if (onPhotosChange) {
        onPhotosChange(photos.filter((p) => p.id !== photoId));
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Erreur lors de la suppression de la photo');
    }
  };

  const handleUpdateCaption = async (photoId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, caption: captionValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update caption');
      }

      // Update local state
      if (onPhotosChange) {
        onPhotosChange(
          photos.map((p) => (p.id === photoId ? { ...p, caption: captionValue } : p))
        );
      }

      setEditingCaption(null);
      setCaptionValue('');
    } catch (error) {
      console.error('Error updating caption:', error);
      alert('Erreur lors de la mise à jour de la légende');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!readOnly && (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <ImagePlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Cliquez pour ajouter des photos
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ou glissez-déposez des images (max 1MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />

                {/* Overlay with actions */}
                {!readOnly && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 bg-white text-black hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCaption(photo.id);
                        setCaptionValue(photo.caption || '');
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 bg-white text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Caption overlay */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-xs text-white truncate">{photo.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune photo pour cette tâche</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex >= 0 && (
        <Lightbox
          open={lightboxIndex >= 0}
          index={lightboxIndex}
          close={() => setLightboxIndex(-1)}
          slides={photos.map((photo) => ({
            src: photo.url,
            alt: photo.caption,
            title: photo.caption,
            description: photo.uploaded_at
              ? new Date(photo.uploaded_at).toLocaleDateString('fr-FR')
              : undefined,
          }))}
        />
      )}

      {/* Caption Edit Modal */}
      {editingCaption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold mb-4">Modifier la légende</h3>
            <Input
              value={captionValue}
              onChange={(e) => setCaptionValue(e.target.value)}
              placeholder="Entrez une légende..."
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCaption(null);
                  setCaptionValue('');
                }}
              >
                Annuler
              </Button>
              <Button onClick={() => handleUpdateCaption(editingCaption)}>Enregistrer</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

