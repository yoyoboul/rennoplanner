'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View, Event, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronLeft, ChevronRight, Calendar, ShoppingCart, Package, Plus } from 'lucide-react';
import type { ShoppingSession, ProjectWithDetails } from '@/lib/types';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { SlideOver } from './slide-over';

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

interface ShoppingSessionsCalendarProps {
  project: ProjectWithDetails;
}

interface SessionEvent extends Event {
  id: string | number;
  resource: {
    session: ShoppingSession;
    total_items: number;
    total_amount: number;
    purchased_items: number;
  };
}

export function ShoppingSessionsCalendar({ project }: ShoppingSessionsCalendarProps) {
  const {
    shoppingSessions,
    purchases,
    fetchShoppingSessions,
    fetchPurchases,
    createShoppingSession,
  } = useStore();

  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<ShoppingSession | null>(null);
  
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    notes: '',
  });

  useEffect(() => {
    fetchShoppingSessions(project.id);
    fetchPurchases(project.id);
  }, [project.id, fetchShoppingSessions, fetchPurchases]);

  // Convertir les sessions en événements calendrier
  const events: SessionEvent[] = useMemo(() => {
    return shoppingSessions.map(session => {
      const sessionPurchases = purchases.filter(p => p.shopping_session_id === session.id);
      const total_items = sessionPurchases.length;
      const total_amount = sessionPurchases.reduce((sum, p) => sum + p.total_price, 0);
      const purchased_items = sessionPurchases.filter(p => p.status === 'purchased').length;
      
      const sessionDate = parseISO(session.date);
      
      return {
        id: session.id,
        title: session.name || 'Session de courses',
        start: sessionDate,
        end: sessionDate,
        allDay: true,
        resource: {
          session,
          total_items,
          total_amount,
          purchased_items,
        },
      };
    });
  }, [shoppingSessions, purchases]);

  const handleSelectSlot = useCallback((slotInfo: { start: Date }) => {
    const selectedDate = startOfDay(slotInfo.start);
    setSelectedDate(selectedDate);
    setFormData({
      date: format(selectedDate, 'yyyy-MM-dd'),
      name: '',
      notes: '',
    });
    setShowAddForm(true);
  }, []);

  const handleSelectEvent = useCallback((event: SessionEvent) => {
    setSelectedSession(event.resource.session);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createShoppingSession({
      project_id: project.id,
      date: formData.date,
      name: formData.name || undefined,
      notes: formData.notes || undefined,
    });
    setShowAddForm(false);
    setFormData({ date: '', name: '', notes: '' });
  };

  const eventStyleGetter = useCallback((event: SessionEvent) => {
    const { total_items, purchased_items } = event.resource;
    
    let backgroundColor = '#3b82f6'; // Bleu par défaut (planifiée)
    
    if (total_items === 0) {
      backgroundColor = '#9ca3af'; // Gris (vide)
    } else if (purchased_items === total_items) {
      backgroundColor = '#10b981'; // Vert (complète)
    } else if (purchased_items > 0) {
      backgroundColor = '#f59e0b'; // Orange (en cours)
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.75rem',
        padding: '2px 6px',
      },
    };
  }, []);

  const CustomToolbar = ({ label, onNavigate }: ToolbarProps<SessionEvent, object>) => {
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
            variant={view === 'agenda' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('agenda')}
          >
            Agenda
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Formulaire création SlideOver */}
      <SlideOver
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setFormData({ date: '', name: '', notes: '' });
        }}
        title="Nouvelle session de courses"
        description={selectedDate ? `Pour le ${format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}` : 'Planifiez une session de courses'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom (optionnel)
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Courses Leroy Merlin, Achat matériaux..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (optionnel)
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes, rappels, adresses..."
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" className="flex-1">
              Créer la session
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false);
                setFormData({ date: '', name: '', notes: '' });
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* Détails session sélectionnée */}
      {selectedSession && (
        <SlideOver
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title="Détails de la session"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Date</h3>
              <p className="text-gray-700">
                {format(parseISO(selectedSession.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
            {selectedSession.name && (
              <div>
                <h3 className="font-semibold mb-1">Nom</h3>
                <p className="text-gray-700">{selectedSession.name}</p>
              </div>
            )}
            {selectedSession.notes && (
              <div>
                <h3 className="font-semibold mb-1">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedSession.notes}</p>
              </div>
            )}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Articles</h3>
              {purchases.filter(p => p.shopping_session_id === selectedSession.id).length === 0 ? (
                <p className="text-sm text-gray-500">Aucun article dans cette session</p>
              ) : (
                <div className="space-y-2">
                  {purchases.filter(p => p.shopping_session_id === selectedSession.id).map(purchase => (
                    <div 
                      key={purchase.id} 
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="text-sm">{purchase.item_name}</span>
                      <span className="text-sm font-medium">{formatCurrency(purchase.total_price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SlideOver>
      )}

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{events.length}</p>
                <p className="text-sm text-gray-600 mt-1">Sessions planifiées</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {events.reduce((sum, e) => sum + e.resource.total_items, 0)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Articles au total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(events.reduce((sum, e) => sum + e.resource.total_amount, 0))}
                </p>
                <p className="text-sm text-gray-600 mt-1">Montant total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendrier des sessions de courses
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
                cursor: pointer;
              }
              .rbc-day-bg:hover {
                background-color: #f9fafb;
              }
              .rbc-month-row {
                border-top: 1px solid #e5e7eb;
                min-height: 80px;
              }
              .rbc-agenda-view {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
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
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              selectable
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
                event: 'Session',
                noEventsInRange: 'Aucune session planifiée pour cette période',
                showMore: (total) => `+ ${total} session(s) supplémentaire(s)`,
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
            <CardTitle className="text-sm">Légende</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500" />
                <span className="text-sm">Session vide</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm">Planifiée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span className="text-sm">En cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-sm">Complète</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

