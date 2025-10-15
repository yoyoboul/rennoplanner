'use client';

import { useEffect, useState, use } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Fab } from '@/components/ui/fab';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { ProjectStats } from '@/components/project-stats';
import { KanbanBoard } from '@/components/kanban-board';
import { AIChat } from '@/components/ai-chat';
import { TimelineView } from '@/components/timeline-view';
import { BudgetManager } from '@/components/budget-manager';
import { ShoppingList } from '@/components/shopping-list';
import { ShoppingSessionsList } from '@/components/shopping-sessions-list';
import { ShoppingSessionsCalendar } from '@/components/shopping-sessions-calendar';
import { KPICards } from '@/components/kpi-cards';
import { TasksView } from '@/components/tasks-view';
import { CalendarView } from '@/components/calendar-view';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { GlobalSearch, useGlobalSearch } from '@/components/global-search';
import { StatCardSkeleton, Spinner } from '@/components/loading-skeleton';
import { SlideOver } from '@/components/slide-over';
import { useIsMobile } from '@/hooks/use-media-query';
import { 
  Plus, 
  ArrowLeft, 
  Home as HomeIcon, 
  DollarSign, 
  Search, 
  LayoutGrid, 
  Kanban, 
  Calendar, 
  ShoppingBag, 
  MessageSquare,
  ChevronDown,
  Sparkles,
  ListChecks,
  FileText,
  Download
} from 'lucide-react';
import Link from 'next/link';
import type { TaskCategory, TaskPriority } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const { currentProject, fetchProject, createRoom, createTask, purchases, fetchPurchases } = useStore();
  const { dialog } = useConfirmDialog();
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch();
  const isMobile = useIsMobile();
  const [view, setView] = useState<'overview' | 'tasks' | 'kanban' | 'timeline' | 'calendar' | 'chat' | 'shopping'>('overview');
  const [shoppingView, setShoppingView] = useState<'list' | 'sessions-list' | 'sessions-calendar'>('list');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', surface_area: '' });
  const [newTask, setNewTask] = useState({
    room_id: '',
    title: '',
    description: '',
    category: 'autre' as TaskCategory,
    priority: 'medium' as TaskPriority,
    estimated_cost: '',
    estimated_duration: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchProject(projectId);
    fetchPurchases(projectId);
  }, [projectId, fetchProject, fetchPurchases]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoom({
      project_id: projectId,
      name: newRoom.name,
      description: newRoom.description,
      surface_area: parseFloat(newRoom.surface_area) || undefined,
    });
    setNewRoom({ name: '', description: '', surface_area: '' });
    setShowAddRoom(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask({
      room_id: newTask.room_id,
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      estimated_cost: parseFloat(newTask.estimated_cost) || 0,
      estimated_duration: parseInt(newTask.estimated_duration) || undefined,
      start_date: newTask.start_date || undefined,
      end_date: newTask.end_date || undefined,
    });
    setNewTask({
      room_id: '',
      title: '',
      description: '',
      category: 'autre',
      priority: 'medium',
      estimated_cost: '',
      estimated_duration: '',
      start_date: '',
      end_date: '',
    });
    setShowAddTask(false);
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-1/2 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          {/* KPI Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          {/* Tabs skeleton */}
          <div className="h-11 w-full bg-gray-100 rounded animate-pulse"></div>
          {/* Content skeleton */}
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  const allTasks = currentProject.rooms.flatMap((r) => r.tasks);

  // FAB actions for mobile
  const fabActions = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: 'Nouvelle tâche',
      onClick: () => setShowAddTask(true),
      color: 'primary' as const,
    },
    {
      icon: <HomeIcon className="w-5 h-5" />,
      label: 'Ajouter pièce',
      onClick: () => setShowAddRoom(true),
      color: 'success' as const,
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Assistant IA',
      onClick: () => setView('chat'),
      color: 'primary' as const,
    },
  ];

  return (
    <>
      {dialog}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        project={currentProject}
        purchases={purchases}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="mb-4 sm:mb-6 space-y-4 sm:space-y-6">
          {/* Breadcrumbs Navigation */}
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'Projets', href: '/' },
              { label: currentProject.name },
            ]}
          />

          {/* Header avec titre et actions */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            {/* Titre du projet */}
            <div className="flex-1 w-full">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                <span className="truncate">{currentProject.name}</span>
              </h1>
              {currentProject.description && (
                <p className="text-sm sm:text-base text-gray-600">{currentProject.description}</p>
              )}
            </div>

            {/* Actions principales */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => setSearchOpen(true)} 
                variant="outline" 
                className="gap-2 flex-1 sm:flex-initial"
                size="sm"
              >
                <Search className="w-4 h-4" />
                <span className="sm:hidden">Chercher</span>
                <span className="hidden sm:inline">Rechercher</span>
              </Button>
              
              <Button 
                onClick={() => setShowAddTask(true)} 
                className="gap-2 flex-1 sm:flex-initial"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:hidden">Tâche</span>
                <span className="hidden sm:inline">Nouvelle tâche</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 min-w-[44px] min-h-[44px]" size="sm">
                    <Sparkles className="w-5 h-5" />
                    <span className="hidden md:inline">Actions</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 sm:w-48">
                  <DropdownMenuItem 
                    onClick={() => setShowAddRoom(true)}
                    className="py-3 px-4 text-base sm:text-sm cursor-pointer"
                  >
                    <Plus className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>Ajouter une pièce</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowBudgetManager(true)}
                    className="py-3 px-4 text-base sm:text-sm cursor-pointer"
                  >
                    <DollarSign className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>Gérer le budget</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setView('shopping')}
                    className="py-3 px-4 text-base sm:text-sm cursor-pointer"
                  >
                    <ShoppingBag className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>Liste de courses</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setView('chat')}
                    className="py-3 px-4 text-base sm:text-sm cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>Assistant IA</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/api/projects/${projectId}/export?type=report`;
                      link.download = `rapport-${currentProject.name}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="py-3 px-4 text-base sm:text-sm cursor-pointer"
                  >
                    <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>Exporter rapport PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/api/projects/${projectId}/export?type=shopping-list`;
                      link.download = `liste-courses-${currentProject.name}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="py-3 px-4 text-base sm:text-sm cursor-pointer"
                  >
                    <Download className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>Exporter liste courses PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* KPI Cards */}
          <KPICards project={currentProject} purchases={purchases} />
        </div>

        {/* Formulaire d'ajout de pièce - SlideOver */}
        <SlideOver
          isOpen={showAddRoom}
          onClose={() => setShowAddRoom(false)}
          title="Ajouter une pièce"
          description="Créez une nouvelle pièce pour votre projet"
          size="md"
        >
          <form onSubmit={handleAddRoom} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom *</label>
                <Input
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="Ex: Cuisine, Salon, Chambre..."
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="Détails supplémentaires..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Surface (m²)</label>
                <Input
                  type="number"
                  value={newRoom.surface_area}
                  onChange={(e) => setNewRoom({ ...newRoom, surface_area: e.target.value })}
                  placeholder="15"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="flex-1">Créer la pièce</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddRoom(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </SlideOver>

        {/* Formulaire d'ajout de tâche - SlideOver */}
        <SlideOver
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          title="Ajouter une tâche"
          description="Créez une nouvelle tâche pour votre projet"
          size="lg"
        >
          <form onSubmit={handleAddTask} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pièce *</label>
                  <select
                    className="w-full h-11 rounded-md border border-gray-300 px-3 py-2 text-base"
                    value={newTask.room_id}
                    onChange={(e) => setNewTask({ ...newTask, room_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une pièce</option>
                    {currentProject.rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Titre *</label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Ex: Refaire la peinture"
                    required
                    autoFocus
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie *</label>
                  <select
                    className="w-full h-11 rounded-md border border-gray-300 px-3 py-2 text-base"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}
                  >
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
                <div>
                  <label className="block text-sm font-medium mb-2">Priorité</label>
                  <select
                    className="w-full h-11 rounded-md border border-gray-300 px-3 py-2 text-base"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Coût estimé (€)</label>
                  <Input
                    type="number"
                    value={newTask.estimated_cost}
                    onChange={(e) => setNewTask({ ...newTask, estimated_cost: e.target.value })}
                    placeholder="500"
                    min="0"
                    step="10"
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Durée (jours)</label>
                  <Input
                    type="number"
                    value={newTask.estimated_duration}
                    onChange={(e) => setNewTask({ ...newTask, estimated_duration: e.target.value })}
                    placeholder="3"
                    min="0"
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date de début</label>
                  <Input
                    type="date"
                    value={newTask.start_date || ''}
                    onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date de fin</label>
                  <Input
                    type="date"
                    value={newTask.end_date || ''}
                    onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-start gap-1">
                <span>💡</span>
                <span>Ajoutez des dates pour visualiser la tâche dans la vue Timeline</span>
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Description détaillée de la tâche..."
                  className="h-11 text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <Button type="submit" className="flex-1 h-11">Créer la tâche</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddTask(false)} className="h-11">
                Annuler
              </Button>
            </div>
          </form>
        </SlideOver>

        {/* Navigation Tabs */}
        <Tabs value={view} onValueChange={(value) => setView(value as typeof view)}>
          <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 tab-scroll-container">
            <TabsList className="w-full sm:w-auto inline-flex justify-start min-w-max sm:min-w-0">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutGrid className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Vue d&apos;ensemble</span>
                <span className="sm:hidden">Vue</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <ListChecks className="w-5 h-5 flex-shrink-0" />
                <span>Tâches</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
                <Kanban className="w-5 h-5 flex-shrink-0" />
                <span>Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span>Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Calendrier</span>
                <span className="sm:hidden">Cal.</span>
              </TabsTrigger>
              <TabsTrigger value="shopping" className="gap-2">
                <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Liste de Courses</span>
                <span className="sm:hidden">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Assistant IA</span>
                <span className="sm:hidden">IA</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <ProjectStats project={currentProject} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentProject.rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {room.description && (
                      <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                    )}
                    {room.surface_area && (
                      <p className="text-sm text-gray-600 mb-3">Surface: {room.surface_area} m²</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tâches</span>
                        <span className="font-medium">{room.tasks.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Terminées</span>
                        <span className="font-medium text-green-600">
                          {room.tasks.filter((t) => t.status === 'completed').length}
                        </span>
                      </div>
                      {room.allocated_budget && room.allocated_budget > 0 && (
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Budget alloué</span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(room.allocated_budget)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tasks View */}
          <TabsContent value="tasks" className="mt-6">
            <TasksView rooms={currentProject.rooms} projectId={projectId} />
          </TabsContent>

          {/* Kanban */}
          <TabsContent value="kanban" className="mt-6">
            <KanbanBoard tasks={allTasks} />
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-6">
            <TimelineView tasks={allTasks} rooms={currentProject.rooms} />
          </TabsContent>

          {/* Calendar */}
          <TabsContent value="calendar" className="mt-6">
            <CalendarView rooms={currentProject.rooms} projectId={projectId} />
          </TabsContent>

          {/* Shopping List */}
          <TabsContent value="shopping" className="mt-6">
            <div className="space-y-6">
              {/* Sub-tabs pour Shopping */}
              <Tabs value={shoppingView} onValueChange={(value) => setShoppingView(value as typeof shoppingView)}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Liste d&apos;achats</span>
                  </TabsTrigger>
                  <TabsTrigger value="sessions-list" className="gap-2">
                    <ListChecks className="w-4 h-4" />
                    <span>Sessions - Liste</span>
                  </TabsTrigger>
                  <TabsTrigger value="sessions-calendar" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Sessions - Calendrier</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="list" className="mt-6">
                  <ShoppingList project={currentProject} />
                </TabsContent>
                
                <TabsContent value="sessions-list" className="mt-6">
                  <ShoppingSessionsList project={currentProject} />
                </TabsContent>
                
                <TabsContent value="sessions-calendar" className="mt-6">
                  <ShoppingSessionsCalendar project={currentProject} />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* AI Chat */}
          <TabsContent value="chat" className="mt-6">
            <AIChat projectId={projectId} onBack={() => setView('overview')} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Budget Manager Modal */}
      {showBudgetManager && (
        <BudgetManager
          project={currentProject}
          onClose={() => setShowBudgetManager(false)}
        />
      )}

      {/* FAB for mobile */}
      {isMobile && <Fab actions={fabActions} />}

      {/* Scroll to top */}
      <ScrollToTop />
    </div>
    </>
  );
}
