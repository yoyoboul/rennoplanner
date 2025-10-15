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
  id: string | number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string | number;
  project_id: string | number;
  name: string;
  description?: string;
  surface_area?: number;
  allocated_budget?: number;
  created_at: string;
}

export interface Task {
  id: string | number;
  room_id: string | number;
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
  id: string | number;
  task_id?: string | number;
  project_id?: string | number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface ChatMessage {
  id: string | number;
  project_id: string | number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  function_call?: string;
  created_at: string;
}

export interface Purchase {
  id: string | number;
  project_id: string | number;
  room_id?: string | number;
  task_id?: string | number;
  shopping_session_id?: string | number;
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

export interface ShoppingSession {
  id: string | number;
  project_id: string | number;
  date: string;
  name?: string;
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
