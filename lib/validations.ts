import { z } from 'zod';

// Schémas de validation pour les entités

export const projectSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(100, 'Le nom est trop long'),
  description: z.string().max(500, 'La description est trop longue').optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  total_budget: z.number().min(0, 'Le budget doit être positif').optional(),
});

export const roomSchema = z.object({
  project_id: z.number().positive('ID projet invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom est trop long'),
  description: z.string().max(300, 'La description est trop longue').optional(),
  surface_area: z.number().positive('La surface doit être positive').optional(),
});

export const taskSchema = z.object({
  room_id: z.number().positive('ID pièce invalide'),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(100, 'Le titre est trop long'),
  description: z.string().max(1000, 'La description est trop longue').optional(),
  category: z.enum(['plomberie', 'electricite', 'peinture', 'menuiserie', 'carrelage', 'platrerie', 'isolation', 'demolition', 'autre']),
  status: z.enum(['todo', 'in_progress', 'completed', 'blocked']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimated_cost: z.number().min(0, 'Le coût doit être positif').optional(),
  actual_cost: z.number().min(0, 'Le coût doit être positif').optional(),
  estimated_duration: z.number().positive('La durée doit être positive').optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  dependencies: z.array(z.number()).optional(),
  notes: z.string().max(2000, 'Les notes sont trop longues').optional(),
});

export const updateTaskSchema = taskSchema.partial().omit({ room_id: true });

export const chatMessageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1, 'Le message ne peut pas être vide').max(5000, 'Le message est trop long'),
  })),
  project_id: z.number().positive('ID projet invalide'),
});

// Types TypeScript à partir des schémas
export type ProjectInput = z.infer<typeof projectSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
