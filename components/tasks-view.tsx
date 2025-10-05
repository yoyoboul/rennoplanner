'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useStore } from '@/lib/store';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  MoreVertical,
  Filter,
  Grid3x3,
  List,
  TrendingUp,
  Euro,
  Calendar as CalendarIcon,
  Layers,
  CalendarPlus,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { TaskStatus, TaskPriority, TaskCategory, TaskWithRoom, RoomWithTasks } from '@/lib/types';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { useConfirmDialog } from './confirm-dialog';
import { TaskPlanner } from './task-planner';

interface TasksViewProps {
  rooms: RoomWithTasks[];
  projectId: number;
}

type ViewMode = 'list' | 'grid';
type GroupBy = 'room' | 'status' | 'category';

const statusConfig = {
  todo: { label: 'À faire', icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100' },
  in_progress: { label: 'En cours', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Terminées', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
  blocked: { label: 'Bloquées', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

const priorityConfig = {
  low: { label: 'Basse', color: 'text-gray-500', badge: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Moyenne', color: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  high: { label: 'Haute', color: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', color: 'text-red-500', badge: 'bg-red-100 text-red-700' },
};

const categoryConfig: Record<TaskCategory, { label: string; emoji: string; color: string }> = {
  plomberie: { label: 'Plomberie', emoji: '🚰', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  electricite: { label: 'Électricité', emoji: '⚡', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  peinture: { label: 'Peinture', emoji: '🎨', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  menuiserie: { label: 'Menuiserie', emoji: '🪚', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  carrelage: { label: 'Carrelage', emoji: '⬜', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  platrerie: { label: 'Plâtrerie', emoji: '🧱', color: 'bg-stone-50 text-stone-700 border-stone-200' },
  isolation: { label: 'Isolation', emoji: '🏠', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  demolition: { label: 'Démolition', emoji: '🔨', color: 'bg-red-50 text-red-700 border-red-200' },
  autre: { label: 'Autre', emoji: '📋', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export function TasksView({ rooms, projectId }: TasksViewProps) {
  const { updateTask, deleteTask } = useStore();
  const { confirm, dialog } = useConfirmDialog();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<GroupBy>('room');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set(rooms.map(r => r.id)));
  const [taskToPlanning, setTaskToPlanning] = useState<(TaskWithRoom & { room_name: string; room_id: number }) | null>(null);

  // Flatten all tasks with room info
  const allTasks = useMemo(() => {
    return rooms.flatMap(room =>
      room.tasks.map(task => ({ ...task, room_name: room.name, room_id: room.id }))
    );
  }, [rooms]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [allTasks, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof filteredTasks> = {};
    
    filteredTasks.forEach(task => {
      let key: string;
      if (groupBy === 'room') key = task.room_name;
      else if (groupBy === 'status') key = statusConfig[task.status].label;
      else key = categoryConfig[task.category].label;
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    
    return groups;
  }, [filteredTasks, groupBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const blocked = allTasks.filter(t => t.status === 'blocked').length;
    const totalEstimated = allTasks.reduce((sum, t) => sum + (t.estimated_cost || 0), 0);
    const totalActual = allTasks.reduce((sum, t) => sum + (t.actual_cost || 0), 0);
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, inProgress, blocked, totalEstimated, totalActual, completionRate };
  }, [allTasks]);

  const toggleRoom = (roomId: number) => {
    setExpandedRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    const confirmed = await confirm({
      title: 'Supprimer la tâche',
      description: `Êtes-vous sûr de vouloir supprimer "${taskTitle}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: async () => {
        await deleteTask(taskId);
      },
    });
  };

  const handleSavePlanning = async (taskId: number, data: any) => {
    await updateTask(taskId, data);
    setTaskToPlanning(null);
  };

  const activeFiltersCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    categoryFilter !== 'all',
    searchQuery.length > 0,
  ].filter(Boolean).length;

  return (
    <>
      {dialog}
      {taskToPlanning && (
        <TaskPlanner
          task={taskToPlanning}
          onSave={handleSavePlanning}
          onClose={() => setTaskToPlanning(null)}
        />
      )}
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                </div>
                <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Progression</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completionRate.toFixed(0)}%</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
              <div className="mt-2 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">En cours</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-base sm:text-2xl font-bold text-purple-600">{formatCurrency(stats.totalEstimated)}</p>
                </div>
                <Euro className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="space-y-3">
              {/* Search */}
              <div className="w-full">
                <Input
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 text-base"
                />
              </div>

              {/* Filters - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                  className="w-full px-3 py-2.5 border rounded-lg text-base"
                >
                  <option value="all">Tous les statuts</option>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                  className="w-full px-3 py-2.5 border rounded-lg text-base"
                >
                  <option value="all">Toutes les priorités</option>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | 'all')}
                  className="w-full px-3 py-2.5 border rounded-lg text-base"
                >
                  <option value="all">Toutes les catégories</option>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.emoji} {config.label}</option>
                  ))}
                </select>
              </div>

              {/* View Mode and Group By + Reset */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* View mode */}
                <div className="flex border rounded-lg overflow-hidden h-11">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none flex-1 sm:flex-initial"
                  >
                    <List className="w-5 h-5" />
                    <span className="ml-2 sm:hidden">Liste</span>
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none flex-1 sm:flex-initial"
                  >
                    <Grid3x3 className="w-5 h-5" />
                    <span className="ml-2 sm:hidden">Grille</span>
                  </Button>
                </div>

                {/* Group by */}
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                  className="flex-1 sm:flex-initial px-3 py-2 border rounded-lg text-base h-11"
                >
                  <option value="room">Par pièce</option>
                  <option value="status">Par statut</option>
                  <option value="category">Par catégorie</option>
                </select>

                {/* Reset filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                    className="h-11 sm:flex-initial"
                  >
                    Réinitialiser ({activeFiltersCount})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Display */}
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Aucune tâche trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([groupName, tasks]) => (
              <Card key={groupName}>
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors py-4 sm:py-6"
                  onClick={() => {
                    if (groupBy === 'room') {
                      const room = rooms.find(r => r.name === groupName);
                      if (room) toggleRoom(room.id);
                    }
                  }}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      {groupBy === 'room' && (
                        expandedRooms.has(rooms.find(r => r.name === groupName)?.id || 0) ? 
                        <ChevronDown className="w-6 h-6 sm:w-5 sm:h-5 flex-shrink-0" /> : 
                        <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5 flex-shrink-0" />
                      )}
                      <span>{groupName}</span>
                      <span className="text-sm sm:text-sm font-normal text-gray-500">
                        ({tasks.length})
                      </span>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 pl-8 sm:pl-0">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {tasks.filter(t => t.status === 'completed').length} / {tasks.length} terminées
                      </span>
                      {tasks.some(t => t.estimated_cost) && (
                        <span className="font-semibold px-2 py-1 bg-purple-50 text-purple-700 rounded">
                          {formatCurrency(tasks.reduce((sum, t) => sum + (t.estimated_cost || 0), 0))}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {(groupBy !== 'room' || expandedRooms.has(rooms.find(r => r.name === groupName)?.id || 0)) && (
                  <CardContent className="pt-4">
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                      {tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          viewMode={viewMode}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDeleteTask}
                          onPlan={setTaskToPlanning}
                        />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface TaskCardProps {
  task: TaskWithRoom & { room_name: string; room_id: number };
  viewMode: ViewMode;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onDelete: (taskId: number, title: string) => void;
  onPlan: (task: TaskWithRoom & { room_name: string; room_id: number }) => void;
}

function TaskCard({ task, viewMode, onStatusChange, onDelete, onPlan }: TaskCardProps) {
  const StatusIcon = statusConfig[task.status].icon;
  const catConfig = categoryConfig[task.category];

  if (viewMode === 'grid') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base sm:text-sm leading-tight">{task.title}</h4>
              <p className="text-sm sm:text-xs text-gray-500 mt-1">{task.room_name}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 flex-shrink-0">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPlan(task)}>
                  <CalendarPlus className="w-5 h-5 mr-3" />
                  Planifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task.id, task.title)}>
                  <Trash2 className="w-5 h-5 mr-3" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Category & Priority */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 text-xs rounded border ${catConfig.color}`}>
              {catConfig.emoji} {catConfig.label}
            </span>
            <span className={`px-2.5 py-1 text-xs rounded ${priorityConfig[task.priority].badge}`}>
              {priorityConfig[task.priority].label}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm sm:text-xs text-gray-600 line-clamp-2">{task.description}</p>
          )}

          {/* Cost & Duration */}
          {(task.estimated_cost || task.estimated_duration) && (
            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-xs text-gray-600">
              {task.estimated_cost && (
                <span className="font-semibold px-2 py-1 bg-gray-100 rounded">
                  {formatCurrency(task.estimated_cost)}
                </span>
              )}
              {task.estimated_duration && (
                <span className="px-2 py-1 bg-gray-100 rounded">{task.estimated_duration}j</span>
              )}
            </div>
          )}

          {/* Status */}
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className={`w-full px-3 py-2.5 text-base sm:text-sm rounded-lg border-2 ${statusConfig[task.status].bg} ${statusConfig[task.status].color} font-medium`}
          >
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </CardContent>
      </Card>
    );
  }

  // List view - Optimized for mobile
  return (
    <div className="p-3 sm:p-4 rounded-lg border hover:bg-gray-50 transition-colors space-y-3">
      {/* Header with title and menu */}
      <div className="flex items-start gap-3">
        <StatusIcon className={`w-5 h-5 ${statusConfig[task.status].color} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base sm:text-sm mb-1">{task.title}</h4>
          <p className="text-sm text-gray-600">{task.room_name}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 flex-shrink-0">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPlan(task)}>
              <CalendarPlus className="w-5 h-5 mr-3" />
              Planifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id, task.title)}>
              <Trash2 className="w-5 h-5 mr-3" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badges - Stack on mobile */}
      <div className="flex flex-wrap gap-2">
        <span className={`px-2.5 py-1 text-xs sm:text-xs rounded border ${catConfig.color}`}>
          {catConfig.emoji} {catConfig.label}
        </span>
        <span className={`px-2.5 py-1 text-xs sm:text-xs rounded ${priorityConfig[task.priority].badge}`}>
          {priorityConfig[task.priority].label}
        </span>
        {task.estimated_cost && (
          <span className="px-2.5 py-1 text-xs sm:text-xs font-semibold text-gray-700 bg-gray-100 rounded">
            {formatCurrency(task.estimated_cost)}
          </span>
        )}
        {task.estimated_duration && (
          <span className="px-2.5 py-1 text-xs sm:text-xs text-gray-700 bg-gray-100 rounded">
            {task.estimated_duration}j
          </span>
        )}
      </div>

      {/* Status selector - Full width on mobile */}
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
        className={`w-full px-3 py-2.5 text-base sm:text-sm rounded-lg border-2 ${statusConfig[task.status].bg} ${statusConfig[task.status].color} font-medium`}
      >
        {Object.entries(statusConfig).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
    </div>
  );
}

