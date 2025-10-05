'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View, Event, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react';
import type { TaskWithRoom, RoomWithTasks } from '@/lib/types';
import { TaskPlanner } from './task-planner';
import { useStore } from '@/lib/store';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
});

interface CalendarViewProps {
  rooms: RoomWithTasks[];
  projectId: string | number;
}

interface CalendarEvent extends Event {
  id: string | number;
  resource: TaskWithRoom & { room_name: string };
}

const categoryColors: Record<string, string> = {
  plomberie: '#3b82f6',
  electricite: '#eab308',
  peinture: '#a855f7',
  menuiserie: '#f97316',
  carrelage: '#6b7280',
  platrerie: '#78716c',
  isolation: '#06b6d4',
  demolition: '#ef4444',
  autre: '#64748b',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  todo: { bg: '#f3f4f6', text: '#374151' },
  in_progress: { bg: '#dbeafe', text: '#1e40af' },
  completed: { bg: '#d1fae5', text: '#065f46' },
  blocked: { bg: '#fee2e2', text: '#991b1b' },
};

export function CalendarView({ rooms }: CalendarViewProps) {
  const { updateTask } = useStore();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<(TaskWithRoom & { room_name: string }) | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);

  // Flatten all tasks with room info
  const allTasks = useMemo(() => {
    return rooms.flatMap(room =>
      room.tasks.map(task => ({ ...task, room_name: room.name, room_id: room.id }))
    );
  }, [rooms]);

  // Convert tasks to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return allTasks
      .filter(task => task.start_date)
      .map(task => {
        const start = parseISO(task.start_date!);
        let end = task.end_date ? parseISO(task.end_date) : start;
        
        // If no end date but has duration, calculate it
        if (!task.end_date && task.estimated_duration) {
          end = addDays(start, task.estimated_duration - 1);
        }

        return {
          id: task.id,
          title: task.title,
          start,
          end,
          resource: task,
          allDay: true,
        };
      });
  }, [allTasks]);

  // Statistics
  const stats = useMemo(() => {
    const planned = allTasks.filter(t => t.start_date).length;
    const unplanned = allTasks.length - planned;
    const thisMonth = events.filter(e => {
      if (!e.start) return false;
      const eventDate = new Date(e.start);
      return eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
    }).length;
    
    return { planned, unplanned, total: allTasks.length, thisMonth };
  }, [allTasks, events, date]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedTask(event.resource);
    setShowPlanner(true);
  }, []);

  const handleSavePlanning = async (
    taskId: string | number,
    data: { start_date?: string; end_date?: string; estimated_duration?: number }
  ) => {
    await updateTask(taskId, data);
    setShowPlanner(false);
    setSelectedTask(null);
  };

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const task = event.resource;
    const categoryColor = categoryColors[task.category] || '#64748b';
    const statusColor = statusColors[task.status];

    return {
      style: {
        backgroundColor: task.status === 'completed' ? statusColor.bg : categoryColor,
        borderColor: categoryColor,
        color: task.status === 'completed' ? statusColor.text : '#ffffff',
        borderRadius: '6px',
        border: '2px solid',
        fontSize: '0.75rem',
        fontWeight: '600',
        padding: '2px 6px',
        opacity: task.status === 'blocked' ? 0.6 : 1,
      },
    };
  }, []);

  const CustomToolbar = ({ label, onNavigate }: ToolbarProps<CalendarEvent, object>) => {
    return (
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('PREV')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('TODAY')}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('NEXT')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h2 className="text-xl font-bold">{label}</h2>

        <div className="flex items-center gap-2">
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Mois
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Semaine
          </Button>
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
          >
            Jour
          </Button>
          <Button
            variant={view === 'agenda' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('agenda')}
          >
            <List className="w-4 h-4 mr-1" />
            Agenda
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {showPlanner && selectedTask && (
        <TaskPlanner
          task={selectedTask}
          onSave={handleSavePlanning}
          onClose={() => {
            setShowPlanner(false);
            setSelectedTask(null);
          }}
        />
      )}

      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.planned}</p>
                <p className="text-sm text-gray-600 mt-1">Tâches planifiées</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{stats.unplanned}</p>
                <p className="text-sm text-gray-600 mt-1">À planifier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.thisMonth}</p>
                <p className="text-sm text-gray-600 mt-1">Ce mois-ci</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-600">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendrier des travaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <style jsx global>{`
              .rbc-calendar {
                font-family: inherit;
                min-height: 600px;
              }
              .rbc-header {
                padding: 12px;
                font-weight: 600;
                border-bottom: 2px solid #e5e7eb;
              }
              .rbc-today {
                background-color: #eff6ff;
              }
              .rbc-off-range-bg {
                background-color: #f9fafb;
              }
              .rbc-event {
                padding: 4px 8px;
                cursor: pointer;
              }
              .rbc-event:hover {
                opacity: 0.8;
              }
              .rbc-month-view {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                overflow: hidden;
              }
              .rbc-day-bg {
                border-left: 1px solid #e5e7eb;
              }
              .rbc-month-row {
                border-top: 1px solid #e5e7eb;
                min-height: 80px;
              }
              .rbc-agenda-view {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
              }
              .rbc-agenda-date-cell,
              .rbc-agenda-time-cell {
                padding: 12px;
              }
              .rbc-agenda-event-cell {
                padding: 8px;
              }
            `}</style>

            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              culture="fr"
              messages={{
                today: "Aujourd'hui",
                previous: 'Précédent',
                next: 'Suivant',
                month: 'Mois',
                week: 'Semaine',
                day: 'Jour',
                agenda: 'Agenda',
                date: 'Date',
                time: 'Heure',
                event: 'Tâche',
                noEventsInRange: 'Aucune tâche planifiée pour cette période',
                showMore: (total) => `+ ${total} tâche(s) supplémentaire(s)`,
              }}
              components={{
                toolbar: CustomToolbar,
              }}
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Légende des catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(categoryColors).map(([category, color]) => (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border-2"
                    style={{ backgroundColor: color, borderColor: color }}
                  />
                  <span className="text-sm capitalize">{category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


