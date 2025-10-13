'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import type { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types';

interface TaskFiltersProps {
  onFilterChange: (filters: TaskFilterOptions) => void;
}

export interface TaskFilterOptions {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  category: TaskCategory | 'all';
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFilterOptions>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
  });

  const handleFilterChange = (key: keyof TaskFilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold">Filtres</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Statut */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminé</option>
          <option value="blocked">Bloqué</option>
        </select>

        {/* Priorité */}
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes les priorités</option>
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
          <option value="urgent">Urgente</option>
        </select>

        {/* Catégorie */}
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes les catégories</option>
          <option value="plomberie">Plomberie</option>
          <option value="electricite">Électricité</option>
          <option value="peinture">Peinture</option>
          <option value="menuiserie">Menuiserie</option>
          <option value="carrelage">Carrelage</option>
          <option value="platrerie">Plâtrerie</option>
          <option value="isolation">Isolation</option>
          <option value="demolition">Démolition</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      {/* Reset filters */}
      {(filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.category !== 'all') && (
        <button
          onClick={() => {
            const resetFilters: TaskFilterOptions = {
              search: '',
              status: 'all',
              priority: 'all',
              category: 'all',
            };
            setFilters(resetFilters);
            onFilterChange(resetFilters);
          }}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
