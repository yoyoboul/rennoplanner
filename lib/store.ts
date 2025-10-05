import { create } from 'zustand';
import { toast } from 'sonner';
import type { Project, Room, Task, ProjectWithDetails, Purchase, PurchaseWithDetails } from './types';
import { handleAPICall, showErrorToast, showSuccessToast } from './client-error-handler';

interface AppState {
  currentProject: ProjectWithDetails | null;
  projects: Project[];
  purchases: PurchaseWithDetails[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentProject: (project: ProjectWithDetails | null) => void;
  setProjects: (projects: Project[]) => void;
  setPurchases: (purchases: PurchaseWithDetails[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API calls
  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: number, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  createRoom: (data: Partial<Room>) => Promise<void>;
  updateRoom: (id: number, data: Partial<Room>) => Promise<void>;
  deleteRoom: (id: number) => Promise<void>;

  createTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (id: number, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;

  fetchPurchases: (projectId: number) => Promise<void>;
  createPurchase: (data: Partial<Purchase>) => Promise<void>;
  updatePurchase: (id: number, data: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: number) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentProject: null,
  projects: [],
  purchases: [],
  isLoading: false,
  error: null,

  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setPurchases: (purchases) => set({ purchases }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await handleAPICall<Project[]>(
        () => fetch('/api/projects'),
        { errorMessage: 'Impossible de charger les projets' }
      );
      set({ projects, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const project = await response.json();
      set({ currentProject: project, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const project = await handleAPICall<Project>(
        () => fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        {
          successMessage: 'Projet créé avec succès !',
          showSuccess: true,
        }
      );
      set({ projects: [...get().projects, project], isLoading: false });
      await get().fetchProject(project.id);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update project');
      await get().fetchProject(id);
      await get().fetchProjects();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete project');
      set({
        projects: get().projects.filter((p) => p.id !== id),
        currentProject: get().currentProject?.id === id ? null : get().currentProject,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createRoom: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await handleAPICall<Room>(
        () => fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        {
          successMessage: 'Pièce ajoutée avec succès !',
          showSuccess: true,
        }
      );
      if (data.project_id) {
        await get().fetchProject(data.project_id);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateRoom: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update room');
      if (get().currentProject) {
        await get().fetchProject(get().currentProject!.id);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteRoom: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete room');
      if (get().currentProject) {
        await get().fetchProject(get().currentProject!.id);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTask: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await handleAPICall<Task>(
        () => fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        {
          successMessage: 'Tâche créée avec succès !',
          showSuccess: true,
        }
      );
      if (get().currentProject) {
        await get().fetchProject(get().currentProject!.id);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateTask: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await handleAPICall<Task>(
        () => fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        {
          successMessage: 'Tâche mise à jour !',
          showSuccess: true,
        }
      );
      if (get().currentProject) {
        await get().fetchProject(get().currentProject!.id);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete task');
      if (get().currentProject) {
        await get().fetchProject(get().currentProject!.id);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPurchases: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/purchases?project_id=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch purchases');
      const purchases = await response.json();
      set({ purchases, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createPurchase: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const purchase = await handleAPICall<Purchase>(
        () => fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        {
          successMessage: 'Achat ajouté avec succès !',
          showSuccess: true,
        }
      );
      set({ purchases: [...get().purchases, purchase], isLoading: false });
      if (data.project_id) {
        await get().fetchPurchases(data.project_id);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updatePurchase: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPurchase = await handleAPICall<Purchase>(
        () => fetch(`/api/purchases/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        {
          successMessage: 'Achat mis à jour !',
          showSuccess: true,
        }
      );
      set({
        purchases: get().purchases.map((p) => (p.id === id ? updatedPurchase : p)),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deletePurchase: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await handleAPICall(
        () => fetch(`/api/purchases/${id}`, { method: 'DELETE' }),
        {
          successMessage: 'Achat supprimé !',
          showSuccess: true,
        }
      );
      set({
        purchases: get().purchases.filter((p) => p.id !== id),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
