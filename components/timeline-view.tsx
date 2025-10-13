'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Task, Room } from '@/lib/types';
import { formatDate, getCategoryIcon, cn } from '@/lib/utils';
import { 
  format, 
  parseISO, 
  differenceInDays, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval,
  eachWeekOfInterval,
  startOfWeek,
  isPast
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, ZoomIn, ZoomOut, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

interface TimelineViewProps {
  tasks: Task[];
  rooms?: Room[];
}

type ViewMode = 'month' | 'week';

export function TimelineView({ tasks, rooms = [] }: TimelineViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [hoveredTask, setHoveredTask] = useState<string | number | null>(null);

  // Filtrer les tâches qui ont des dates
  const tasksWithDates = useMemo(() => {
    return tasks.filter(task => task.start_date && task.end_date);
  }, [tasks]);

  // Grouper les tâches par pièce
  const tasksByRoom = useMemo(() => {
    const grouped = new Map<string | number, Task[]>();
    
    tasksWithDates.forEach(task => {
      const roomId = task.room_id;
      if (!grouped.has(roomId)) {
        grouped.set(roomId, []);
      }
      grouped.get(roomId)!.push(task);
    });

    // Trier les tâches par date de début dans chaque groupe
    grouped.forEach(tasks => {
      tasks.sort((a, b) => {
        const dateA = a.start_date ? parseISO(a.start_date) : new Date(0);
        const dateB = b.start_date ? parseISO(b.start_date) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
    });

    return grouped;
  }, [tasksWithDates]);

  // Calculer la plage de dates
  const dateRange = useMemo(() => {
    if (tasksWithDates.length === 0) return null;

    const dates = tasksWithDates.flatMap(task => [
      task.start_date ? parseISO(task.start_date) : null,
      task.end_date ? parseISO(task.end_date) : null,
    ]).filter(Boolean) as Date[];

    if (dates.length === 0) return null;

    const minDate = startOfMonth(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = endOfMonth(new Date(Math.max(...dates.map(d => d.getTime()))));

    return { 
      minDate, 
      maxDate, 
      days: differenceInDays(maxDate, minDate) + 1,
      months: eachMonthOfInterval({ start: minDate, end: maxDate }),
      weeks: eachWeekOfInterval({ start: minDate, end: maxDate }, { locale: fr })
    };
  }, [tasksWithDates]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const total = tasksWithDates.length;
    const completed = tasksWithDates.filter(t => t.status === 'completed').length;
    const inProgress = tasksWithDates.filter(t => t.status === 'in_progress').length;
    const delayed = tasksWithDates.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.end_date) return false;
      return isPast(parseISO(t.end_date));
    }).length;

    return { total, completed, inProgress, delayed };
  }, [tasksWithDates]);

  // Calculer la position de la ligne "aujourd'hui"
  const getTodayPosition = () => {
    if (!dateRange) return null;
    const { minDate, days } = dateRange;
    const today = new Date();
    
    if (today < minDate || today > dateRange.maxDate) return null;
    
    const daysSinceStart = differenceInDays(today, minDate);
    return `${(daysSinceStart / days) * 100}%`;
  };

  if (!dateRange || tasksWithDates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2 font-medium">
            Aucune tâche avec des dates planifiées
          </p>
          <p className="text-sm text-gray-400">
            Ajoutez des dates de début et de fin aux tâches pour voir la timeline Gantt
          </p>
        </CardContent>
      </Card>
    );
  }

  const { minDate, maxDate, days, months, weeks } = dateRange;
  const todayPosition = getTodayPosition();

  // Calculer la position et la largeur de chaque tâche
  const getTaskPosition = (task: Task) => {
    if (!task.start_date || !task.end_date) return null;

    const start = parseISO(task.start_date);
    const end = parseISO(task.end_date);
    const startDays = differenceInDays(start, minDate);
    const duration = differenceInDays(end, start) + 1;

    const isDelayed = task.status !== 'completed' && isPast(end);

    return {
      left: `${(startDays / days) * 100}%`,
      width: `${(duration / days) * 100}%`,
      isDelayed,
      start,
      end,
      duration
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline Gantt
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Du {format(minDate, 'dd MMMM yyyy', { locale: fr })} au {format(maxDate, 'dd MMMM yyyy', { locale: fr })}
              <span className="ml-2 text-gray-400">• {days} jours</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('month')}
              className={cn(viewMode === 'month' && 'bg-blue-50 border-blue-300')}
            >
              <ZoomOut className="w-4 h-4 mr-1" />
              Mensuel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('week')}
              className={cn(viewMode === 'week' && 'bg-blue-50 border-blue-300')}
            >
              <ZoomIn className="w-4 h-4 mr-1" />
              Hebdo
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-medium">{stats.completed}</span>
            <span className="text-gray-500">terminées</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{stats.inProgress}</span>
            <span className="text-gray-500">en cours</span>
          </div>
          {stats.delayed > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-600">{stats.delayed}</span>
              <span className="text-gray-500">en retard</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Grille temporelle */}
          <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4 border">
            <div className="relative h-16">
              {/* Mois */}
              <div className="absolute inset-x-0 top-0 flex">
                {months.map((month, idx) => {
                  const monthStart = startOfMonth(month);
                  const monthEnd = endOfMonth(month);
                  const monthDays = differenceInDays(monthEnd, monthStart) + 1;
                  const startDays = differenceInDays(monthStart, minDate);
                  const width = (monthDays / days) * 100;
                  const left = (startDays / days) * 100;

                  return (
                    <div
                      key={idx}
                      className="absolute top-0 h-8 border-r border-gray-300 flex items-center justify-center"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="text-xs font-semibold text-gray-700 uppercase">
                        {format(month, 'MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Semaines (vue hebdomadaire) */}
              {viewMode === 'week' && (
                <div className="absolute inset-x-0 top-8 flex">
                  {weeks.map((week, idx) => {
                    const weekStart = startOfWeek(week, { locale: fr });
                    const weekDays = 7;
                    const startDays = differenceInDays(weekStart, minDate);
                    const width = (weekDays / days) * 100;
                    const left = (startDays / days) * 100;

                    return (
                      <div
                        key={idx}
                        className="absolute h-8 border-r border-gray-200 flex items-center justify-center text-[10px] text-gray-500"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        S{format(week, 'w', { locale: fr })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Légende */}
            <div className="mt-6 pt-4 border-t border-gray-300 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>À faire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span>En cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Terminée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>En retard</span>
              </div>
              {todayPosition && (
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-0.5 h-4 bg-purple-600"></div>
                  <span className="font-medium text-purple-600">Aujourd&apos;hui</span>
                </div>
              )}
            </div>
          </div>

          {/* Tâches par pièce */}
          <div className="space-y-8">
            {Array.from(tasksByRoom.entries()).map(([roomId, roomTasks]) => {
              const room = rooms.find(r => r.id === roomId);
              const roomName = room?.name || 'Pièce inconnue';

              return (
                <div key={roomId} className="space-y-3">
                  {/* En-tête de pièce */}
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-200">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <h3 className="font-semibold text-gray-800">{roomName}</h3>
                    <span className="text-sm text-gray-500">• {roomTasks.length} tâche{roomTasks.length > 1 ? 's' : ''}</span>
                  </div>

                  {/* Tâches */}
                  <div className="space-y-2">
                    {roomTasks.map((task) => {
                      const position = getTaskPosition(task);
                      if (!position) return null;

                      const isHovered = hoveredTask === task.id;
                      const statusColors = {
                        todo: 'bg-blue-500 hover:bg-blue-600',
                        in_progress: 'bg-yellow-500 hover:bg-yellow-600',
                        completed: 'bg-green-500 hover:bg-green-600',
                        blocked: 'bg-red-500 hover:bg-red-600',
                      };

                      const color = position.isDelayed 
                        ? 'bg-red-500 hover:bg-red-600 border-2 border-red-700' 
                        : statusColors[task.status] || statusColors.todo;

                      return (
                        <div key={task.id} className="relative group">
                          {/* Label de la tâche */}
                          <div className="flex items-center gap-2 mb-1 h-6">
                            <span className="text-base">{getCategoryIcon(task.category)}</span>
                            <span className="text-sm font-medium text-gray-700 truncate flex-1">
                              {task.title}
                            </span>
                            {position.isDelayed && (
                              <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
                            )}
                          </div>

                          {/* Barre de timeline */}
                          <div className="relative h-12 bg-gray-100 rounded-lg overflow-visible">
                            {/* Ligne "aujourd'hui" */}
                            {todayPosition && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-purple-600 z-20 opacity-50"
                                style={{ left: todayPosition }}
                              >
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-600 rounded-full"></div>
                              </div>
                            )}

                            {/* Barre de tâche */}
                            <div
                              className={cn(
                                'absolute h-full rounded-lg px-3 flex items-center justify-between text-white text-xs font-medium transition-all cursor-pointer shadow-md',
                                color,
                                isHovered && 'scale-105 shadow-lg z-10'
                              )}
                              style={{
                                left: position.left,
                                width: position.width,
                              }}
                              onMouseEnter={() => setHoveredTask(task.id)}
                              onMouseLeave={() => setHoveredTask(null)}
                            >
                              <span className="truncate">
                                {task.estimated_duration ? `${task.estimated_duration}j` : ''}
                              </span>
                              {task.estimated_cost && (
                                <span className="text-xs opacity-90">
                                  {task.estimated_cost}€
                                </span>
                              )}

                              {/* Tooltip */}
                              {isHovered && (
                                <div className="absolute left-1/2 -translate-x-1/2 -top-32 bg-gray-900 text-white p-4 rounded-lg shadow-xl z-50 min-w-[280px] pointer-events-none">
                                  <div className="space-y-2">
                                    <div className="font-semibold text-sm border-b border-gray-700 pb-2">
                                      {task.title}
                                    </div>
                                    <div className="text-xs space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Début:</span>
                                        <span>{formatDate(task.start_date!)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Fin:</span>
                                        <span>{formatDate(task.end_date!)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Durée:</span>
                                        <span>{position.duration} jour{position.duration > 1 ? 's' : ''}</span>
                                      </div>
                                      {task.estimated_cost && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Budget:</span>
                                          <span>{task.estimated_cost}€</span>
                                        </div>
                                      )}
                                      {position.isDelayed && (
                                        <div className="pt-2 border-t border-gray-700 text-red-400 font-medium">
                                          ⚠️ Tâche en retard
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {/* Arrow */}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Dates sous la barre */}
                          <div className="flex justify-between text-[11px] text-gray-500 mt-1 px-1">
                            <span>{formatDate(task.start_date!)}</span>
                            <span>{formatDate(task.end_date!)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}