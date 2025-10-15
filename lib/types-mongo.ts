import { ObjectId } from 'mongodb';

// Types MongoDB (avec ObjectId au lieu de number pour les IDs)

export interface ProjectMongo {
  _id?: ObjectId;
  name: string;
  description?: string;
  total_budget?: number;
  created_at: Date;
  updated_at: Date;
}

export interface RoomMongo {
  _id?: ObjectId;
  project_id: ObjectId;
  name: string;
  description?: string;
  surface_area?: number;
  allocated_budget?: number;
  created_at: Date;
  updated_at: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 
  | 'plomberie'
  | 'electricite'
  | 'peinture'
  | 'menuiserie'
  | 'carrelage'
  | 'platrerie'
  | 'isolation'
  | 'demolition'
  | 'autre';

export interface PhotoMetadata {
  id: string;
  url: string;
  caption?: string;
  uploaded_at: string;
  uploaded_by?: string;
  size: number;
  mimeType: string;
}

export interface TaskMongo {
  _id?: ObjectId;
  room_id: ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_duration?: number;
  actual_duration?: number;
  start_date?: Date;
  end_date?: Date;
  dependencies?: ObjectId[];
  photos?: PhotoMetadata[];
  created_at: Date;
  updated_at: Date;
}

export type PurchaseStatus = 'planned' | 'in_cart' | 'purchased';
export type PurchaseItemType = 'materiaux' | 'meubles';

export interface PurchaseMongo {
  _id?: ObjectId;
  project_id: ObjectId;
  room_id?: ObjectId;
  task_id?: ObjectId;
  shopping_session_id?: ObjectId;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  item_type: PurchaseItemType;
  supplier?: string;
  status: PurchaseStatus;
  purchase_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingSessionMongo {
  _id?: ObjectId;
  project_id: ObjectId;
  date: Date;
  name?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Types pour l'API (compatibles avec le frontend)
export interface Project {
  id: string;
  name: string;
  description?: string;
  total_budget?: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  surface_area?: number;
  allocated_budget?: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  room_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_duration?: number;
  actual_duration?: number;
  start_date?: string;
  end_date?: string;
  dependencies?: string[];
  photos?: PhotoMetadata[];
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  project_id: string;
  room_id?: string;
  task_id?: string;
  shopping_session_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  item_type: PurchaseItemType;
  supplier?: string;
  status: PurchaseStatus;
  purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingSession {
  id: string;
  project_id: string;
  date: string;
  name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Types composés (pour le frontend)
export interface TaskWithRoom extends Task {
  room_name?: string;
}

export interface RoomWithTasks extends Room {
  tasks: Task[];
}

export interface ProjectWithRooms extends Project {
  rooms: RoomWithTasks[];
}

export interface PurchaseWithDetails extends Purchase {
  room_name?: string;
  task_title?: string;
  shopping_session_name?: string;
  shopping_session_date?: string;
}

export interface ShoppingSessionWithDetails extends ShoppingSession {
  purchases: PurchaseWithDetails[];
  total_items: number;
  total_amount: number;
  purchased_items: number;
  purchased_amount: number;
}

// Fonctions de conversion MongoDB → API
export function projectToApi(doc: ProjectMongo): Project {
  return {
    id: doc._id!.toString(),
    name: doc.name,
    description: doc.description,
    total_budget: doc.total_budget,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

export function roomToApi(doc: RoomMongo): Room {
  return {
    id: doc._id!.toString(),
    project_id: doc.project_id.toString(),
    name: doc.name,
    description: doc.description,
    surface_area: doc.surface_area,
    allocated_budget: doc.allocated_budget,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

export function taskToApi(doc: TaskMongo): Task {
  return {
    id: doc._id!.toString(),
    room_id: doc.room_id.toString(),
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    category: doc.category,
    estimated_cost: doc.estimated_cost,
    actual_cost: doc.actual_cost,
    estimated_duration: doc.estimated_duration,
    actual_duration: doc.actual_duration,
    start_date: doc.start_date?.toISOString(),
    end_date: doc.end_date?.toISOString(),
    dependencies: doc.dependencies?.map(id => id.toString()),
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

export function purchaseToApi(doc: PurchaseMongo): Purchase {
  return {
    id: doc._id!.toString(),
    project_id: doc.project_id.toString(),
    room_id: doc.room_id?.toString(),
    task_id: doc.task_id?.toString(),
    shopping_session_id: doc.shopping_session_id?.toString(),
    item_name: doc.name,
    description: doc.description,
    quantity: doc.quantity,
    unit_price: doc.unit_price,
    total_price: doc.total_price,
    category: doc.category,
    item_type: doc.item_type,
    supplier: doc.supplier,
    status: doc.status,
    purchase_date: doc.purchase_date?.toISOString(),
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

export function shoppingSessionToApi(doc: ShoppingSessionMongo): ShoppingSession {
  return {
    id: doc._id!.toString(),
    project_id: doc.project_id.toString(),
    date: doc.date.toISOString().split('T')[0], // Format YYYY-MM-DD
    name: doc.name,
    notes: doc.notes,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

