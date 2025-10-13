import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'todo':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    plomberie: '🔧',
    electricite: '⚡',
    peinture: '🎨',
    menuiserie: '🪚',
    carrelage: '⬜',
    platrerie: '🧱',
    isolation: '🏠',
    demolition: '🔨',
    autre: '📋',
  };
  return icons[category] || '📋';
}

export function filterTasks<T extends { title: string; description?: string; status: string; priority: string; category: string }>(
  tasks: T[],
  filters: {
    search: string;
    status: string;
    priority: string;
    category: string;
  }
): T[] {
  return tasks.filter(task => {
    // Recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(searchLower) ||
        (task.description?.toLowerCase().includes(searchLower) ?? false);
      if (!matchesSearch) return false;
    }

    // Statut
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // Priorité
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    // Catégorie
    if (filters.category !== 'all' && task.category !== filters.category) {
      return false;
    }

    return true;
  });
}
