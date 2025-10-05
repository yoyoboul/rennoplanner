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
export type PurchaseStatus = 'planned' | 'in_cart' | 'purchased';
export type PurchaseItemType = 'materiaux' | 'meubles';

export interface Project {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  surface_area?: number;
  allocated_budget?: number;
  created_at: string;
}

export interface Task {
  id: number;
  room_id: number;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_duration?: number; // in days
  start_date?: string;
  end_date?: string;
  dependencies?: string; // JSON array of task IDs
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  task_id?: number;
  project_id?: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface ChatMessage {
  id: number;
  project_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  function_call?: string;
  created_at: string;
}

export interface Purchase {
  id: number;
  project_id: number;
  room_id?: number;
  task_id?: number;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  item_type: PurchaseItemType;
  supplier?: string;
  purchase_date?: string;
  status: PurchaseStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWithRoom extends Task {
  room_name: string;
}

export interface RoomWithTasks extends Room {
  tasks: Task[];
}

export interface ProjectWithDetails extends Project {
  rooms: RoomWithTasks[];
  total_tasks: number;
  completed_tasks: number;
  total_spent: number;
}

export interface PurchaseWithDetails extends Purchase {
  room_name?: string;
  task_title?: string;
}
