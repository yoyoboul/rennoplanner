import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import type {
  ProjectMongo,
  RoomMongo,
  TaskMongo,
  PurchaseMongo,
  Project,
  Room,
  Task,
  Purchase,
  ProjectWithRooms,
  RoomWithTasks,
  projectToApi,
  roomToApi,
  taskToApi,
  purchaseToApi,
} from './types-mongo';

// ==================== PROJECTS ====================

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDatabase();
  const projects = await db.collection<ProjectMongo>('projects')
    .find({})
    .sort({ created_at: -1 })
    .toArray();
  
  return projects.map(projectToApi);
}

export async function getProjectById(id: string): Promise<ProjectWithRooms | null> {
  const db = await getDatabase();
  
  const project = await db.collection<ProjectMongo>('projects')
    .findOne({ _id: new ObjectId(id) });
  
  if (!project) return null;
  
  // Récupérer les pièces avec leurs tâches
  const rooms = await db.collection<RoomMongo>('rooms')
    .find({ project_id: new ObjectId(id) })
    .toArray();
  
  const roomsWithTasks: RoomWithTasks[] = await Promise.all(
    rooms.map(async (room) => {
      const tasks = await db.collection<TaskMongo>('tasks')
        .find({ room_id: room._id! })
        .toArray();
      
      return {
        ...roomToApi(room),
        tasks: tasks.map(taskToApi),
      };
    })
  );
  
  return {
    ...projectToApi(project),
    rooms: roomsWithTasks,
  };
}

export async function createProject(data: {
  name: string;
  description?: string;
  total_budget?: number;
}): Promise<Project> {
  const db = await getDatabase();
  const now = new Date();
  
  const projectDoc: ProjectMongo = {
    name: data.name,
    description: data.description,
    total_budget: data.total_budget,
    created_at: now,
    updated_at: now,
  };
  
  const result = await db.collection<ProjectMongo>('projects').insertOne(projectDoc);
  projectDoc._id = result.insertedId;
  
  return projectToApi(projectDoc);
}

export async function updateProject(id: string, data: Partial<ProjectMongo>): Promise<Project | null> {
  const db = await getDatabase();
  
  const result = await db.collection<ProjectMongo>('projects').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updated_at: new Date() } },
    { returnDocument: 'after' }
  );
  
  return result ? projectToApi(result) : null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await getDatabase();
  const projectId = new ObjectId(id);
  
  // Supprimer les pièces
  const rooms = await db.collection<RoomMongo>('rooms')
    .find({ project_id: projectId })
    .toArray();
  
  const roomIds = rooms.map(r => r._id!);
  
  // Supprimer les tâches des pièces
  if (roomIds.length > 0) {
    await db.collection<TaskMongo>('tasks').deleteMany({ room_id: { $in: roomIds } });
  }
  
  // Supprimer les pièces
  await db.collection<RoomMongo>('rooms').deleteMany({ project_id: projectId });
  
  // Supprimer les achats
  await db.collection<PurchaseMongo>('purchases').deleteMany({ project_id: projectId });
  
  // Supprimer le projet
  const result = await db.collection<ProjectMongo>('projects').deleteOne({ _id: projectId });
  
  return result.deletedCount === 1;
}

// ==================== ROOMS ====================

export async function getRoomsByProjectId(projectId: string): Promise<Room[]> {
  const db = await getDatabase();
  const rooms = await db.collection<RoomMongo>('rooms')
    .find({ project_id: new ObjectId(projectId) })
    .toArray();
  
  return rooms.map(roomToApi);
}

export async function getRoomById(id: string): Promise<Room | null> {
  const db = await getDatabase();
  const room = await db.collection<RoomMongo>('rooms')
    .findOne({ _id: new ObjectId(id) });
  
  return room ? roomToApi(room) : null;
}

export async function createRoom(data: {
  project_id: string;
  name: string;
  description?: string;
  surface_area?: number;
  allocated_budget?: number;
}): Promise<Room> {
  const db = await getDatabase();
  const now = new Date();
  
  const roomDoc: RoomMongo = {
    project_id: new ObjectId(data.project_id),
    name: data.name,
    description: data.description,
    surface_area: data.surface_area,
    allocated_budget: data.allocated_budget,
    created_at: now,
    updated_at: now,
  };
  
  const result = await db.collection<RoomMongo>('rooms').insertOne(roomDoc);
  roomDoc._id = result.insertedId;
  
  return roomToApi(roomDoc);
}

export async function updateRoom(id: string, data: Partial<RoomMongo>): Promise<Room | null> {
  const db = await getDatabase();
  
  const result = await db.collection<RoomMongo>('rooms').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updated_at: new Date() } },
    { returnDocument: 'after' }
  );
  
  return result ? roomToApi(result) : null;
}

export async function deleteRoom(id: string): Promise<boolean> {
  const db = await getDatabase();
  const roomId = new ObjectId(id);
  
  // Supprimer les tâches de la pièce
  await db.collection<TaskMongo>('tasks').deleteMany({ room_id: roomId });
  
  // Supprimer les achats liés à la pièce
  await db.collection<PurchaseMongo>('purchases').deleteMany({ room_id: roomId });
  
  // Supprimer la pièce
  const result = await db.collection<RoomMongo>('rooms').deleteOne({ _id: roomId });
  
  return result.deletedCount === 1;
}

// ==================== TASKS ====================

export async function getTasksByRoomId(roomId: string): Promise<Task[]> {
  const db = await getDatabase();
  const tasks = await db.collection<TaskMongo>('tasks')
    .find({ room_id: new ObjectId(roomId) })
    .toArray();
  
  return tasks.map(taskToApi);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const task = await db.collection<TaskMongo>('tasks')
    .findOne({ _id: new ObjectId(id) });
  
  return task ? taskToApi(task) : null;
}

export async function createTask(data: any): Promise<Task> {
  const db = await getDatabase();
  const now = new Date();
  
  const taskDoc: TaskMongo = {
    room_id: new ObjectId(data.room_id),
    title: data.title,
    description: data.description,
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    category: data.category,
    estimated_cost: data.estimated_cost,
    actual_cost: data.actual_cost,
    estimated_duration: data.estimated_duration,
    actual_duration: data.actual_duration,
    start_date: data.start_date ? new Date(data.start_date) : undefined,
    end_date: data.end_date ? new Date(data.end_date) : undefined,
    dependencies: data.dependencies?.map((id: string) => new ObjectId(id)),
    created_at: now,
    updated_at: now,
  };
  
  const result = await db.collection<TaskMongo>('tasks').insertOne(taskDoc);
  taskDoc._id = result.insertedId;
  
  return taskToApi(taskDoc);
}

export async function updateTask(id: string, data: any): Promise<Task | null> {
  const db = await getDatabase();
  
  const updateData: any = { ...data, updated_at: new Date() };
  
  if (data.start_date) updateData.start_date = new Date(data.start_date);
  if (data.end_date) updateData.end_date = new Date(data.end_date);
  if (data.dependencies) updateData.dependencies = data.dependencies.map((id: string) => new ObjectId(id));
  
  const result = await db.collection<TaskMongo>('tasks').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  
  return result ? taskToApi(result) : null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = await getDatabase();
  
  // Supprimer les achats liés
  await db.collection<PurchaseMongo>('purchases').deleteMany({ task_id: new ObjectId(id) });
  
  const result = await db.collection<TaskMongo>('tasks').deleteOne({ _id: new ObjectId(id) });
  
  return result.deletedCount === 1;
}

// ==================== PURCHASES ====================

export async function getPurchasesByProjectId(projectId: string): Promise<Purchase[]> {
  const db = await getDatabase();
  const purchases = await db.collection<PurchaseMongo>('purchases')
    .find({ project_id: new ObjectId(projectId) })
    .toArray();
  
  return purchases.map(purchaseToApi);
}

export async function getPurchaseById(id: string): Promise<Purchase | null> {
  const db = await getDatabase();
  const purchase = await db.collection<PurchaseMongo>('purchases')
    .findOne({ _id: new ObjectId(id) });
  
  return purchase ? purchaseToApi(purchase) : null;
}

export async function createPurchase(data: any): Promise<Purchase> {
  const db = await getDatabase();
  const now = new Date();
  
  const purchaseDoc: PurchaseMongo = {
    project_id: new ObjectId(data.project_id),
    room_id: data.room_id ? new ObjectId(data.room_id) : undefined,
    task_id: data.task_id ? new ObjectId(data.task_id) : undefined,
    name: data.name,
    description: data.description,
    quantity: data.quantity,
    unit_price: data.unit_price,
    total_price: data.total_price || (data.quantity * data.unit_price),
    category: data.category,
    supplier: data.supplier,
    status: data.status || 'planned',
    purchase_date: data.purchase_date ? new Date(data.purchase_date) : undefined,
    created_at: now,
    updated_at: now,
  };
  
  const result = await db.collection<PurchaseMongo>('purchases').insertOne(purchaseDoc);
  purchaseDoc._id = result.insertedId;
  
  return purchaseToApi(purchaseDoc);
}

export async function updatePurchase(id: string, data: any): Promise<Purchase | null> {
  const db = await getDatabase();
  
  const updateData: any = { ...data, updated_at: new Date() };
  
  if (data.purchase_date) updateData.purchase_date = new Date(data.purchase_date);
  if (data.room_id) updateData.room_id = new ObjectId(data.room_id);
  if (data.task_id) updateData.task_id = new ObjectId(data.task_id);
  
  const result = await db.collection<PurchaseMongo>('purchases').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  
  return result ? purchaseToApi(result) : null;
}

export async function deletePurchase(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection<PurchaseMongo>('purchases').deleteOne({ _id: new ObjectId(id) });
  
  return result.deletedCount === 1;
}

