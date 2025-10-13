import { z } from 'zod';

// ============================================
// PROJECTS
// ============================================

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du projet est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  start_date: z.string()
    .datetime()
    .optional()
    .or(z.literal('')),
  end_date: z.string()
    .datetime()
    .optional()
    .or(z.literal('')),
  total_budget: z.number()
    .min(0, 'Le budget doit être positif')
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du projet est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .optional(),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  start_date: z.string()
    .datetime()
    .optional()
    .or(z.literal(''))
    .nullable(),
  end_date: z.string()
    .datetime()
    .optional()
    .or(z.literal(''))
    .nullable(),
  total_budget: z.number()
    .min(0, 'Le budget doit être positif')
    .optional(),
});

// ============================================
// ROOMS
// ============================================

export const createRoomSchema = z.object({
  project_id: z.union([z.number().int().positive(), z.string().min(1)])
    .transform((val) => String(val)),
  name: z.string()
    .min(1, 'Le nom de la pièce est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  surface_area: z.number()
    .min(0, 'La surface doit être positive')
    .optional(),
  allocated_budget: z.number()
    .min(0, 'Le budget alloué doit être positif')
    .optional(),
});

export const updateRoomSchema = z.object({
  name: z.string()
    .min(1, 'Le nom de la pièce est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .optional(),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  surface_area: z.number()
    .min(0, 'La surface doit être positive')
    .optional()
    .nullable(),
  allocated_budget: z.number()
    .min(0, 'Le budget alloué doit être positif')
    .optional()
    .nullable(),
});

// ============================================
// TASKS
// ============================================

const taskCategorySchema = z.enum([
  'plomberie',
  'electricite',
  'peinture',
  'menuiserie',
  'carrelage',
  'platrerie',
  'isolation',
  'demolition',
  'autre',
]);

const taskStatusSchema = z.enum(['todo', 'in_progress', 'completed', 'blocked']);

const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const createTaskSchema = z.object({
  room_id: z.union([z.number().int().positive(), z.string().min(1)])
    .transform((val) => String(val)),
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  category: taskCategorySchema,
  status: taskStatusSchema.optional().default('todo'),
  priority: taskPrioritySchema.optional().default('medium'),
  estimated_cost: z.number()
    .min(0, 'Le coût estimé doit être positif')
    .optional(),
  actual_cost: z.number()
    .min(0, 'Le coût réel doit être positif')
    .optional(),
  estimated_duration: z.number()
    .min(0.5, 'La durée doit être d\'au moins 0.5 jour')
    .optional(),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  dependencies: z.string()
    .optional(),
  notes: z.string()
    .max(2000, 'Les notes ne peuvent pas dépasser 2000 caractères')
    .optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: 'La date de fin doit être après la date de début',
    path: ['end_date'],
  }
);

export const updateTaskSchema = z.object({
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .optional(),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  category: taskCategorySchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  estimated_cost: z.number()
    .min(0, 'Le coût estimé doit être positif')
    .optional()
    .nullable(),
  actual_cost: z.number()
    .min(0, 'Le coût réel doit être positif')
    .optional()
    .nullable(),
  estimated_duration: z.number()
    .min(0.5, 'La durée doit être d\'au moins 0.5 jour')
    .optional()
    .nullable(),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal(''))
    .nullable(),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal(''))
    .nullable(),
  dependencies: z.string()
    .optional()
    .nullable(),
  notes: z.string()
    .max(2000, 'Les notes ne peuvent pas dépasser 2000 caractères')
    .optional()
    .nullable(),
});

// ============================================
// PURCHASES
// ============================================

const purchaseStatusSchema = z.enum(['planned', 'in_cart', 'purchased']);
const purchaseItemTypeSchema = z.enum(['materiaux', 'meubles']);

export const createPurchaseSchema = z.object({
  project_id: z.union([z.number().int().positive(), z.string().min(1)])
    .transform((val) => String(val)),
  room_id: z.union([z.number().int().positive(), z.string().min(1)])
    .transform((val) => String(val))
    .optional(),
  task_id: z.union([z.number().int().positive(), z.string().min(1)])
    .transform((val) => String(val))
    .optional(),
  item_name: z.string()
    .min(1, 'Le nom de l\'article est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  quantity: z.number()
    .min(0.01, 'La quantité doit être positive')
    .optional()
    .default(1),
  unit_price: z.number()
    .min(0, 'Le prix unitaire doit être positif')
    .optional()
    .default(0),
  category: z.string()
    .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
    .optional(),
  item_type: purchaseItemTypeSchema.optional().default('materiaux'),
  supplier: z.string()
    .max(200, 'Le nom du fournisseur ne peut pas dépasser 200 caractères')
    .optional(),
  purchase_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  status: purchaseStatusSchema.optional().default('planned'),
  notes: z.string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional(),
});

export const updatePurchaseSchema = z.object({
  item_name: z.string()
    .min(1, 'Le nom de l\'article est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .optional(),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  quantity: z.number()
    .min(0.01, 'La quantité doit être positive')
    .optional(),
  unit_price: z.number()
    .min(0, 'Le prix unitaire doit être positif')
    .optional(),
  category: z.string()
    .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
    .optional()
    .nullable(),
  item_type: purchaseItemTypeSchema.optional(),
  supplier: z.string()
    .max(200, 'Le nom du fournisseur ne peut pas dépasser 200 caractères')
    .optional()
    .nullable(),
  purchase_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal(''))
    .nullable(),
  status: purchaseStatusSchema.optional(),
  notes: z.string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .nullable(),
});

// ============================================
// CHAT
// ============================================

export const chatMessageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1, 'Le message ne peut pas être vide'),
  })).min(1, 'Au moins un message est requis'),
  project_id: z.union([z.number().int().positive(), z.string().min(1)])
    .transform((val) => typeof val === 'number' ? val : val),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((err: z.ZodIssue) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });
  
  return { success: false, errors };
}
