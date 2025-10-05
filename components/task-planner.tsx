'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar, Clock, X, AlertCircle } from 'lucide-react';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Task } from '@/lib/types';

interface TaskPlannerProps {
  task: Task;
  onSave: (taskId: string | number, data: { start_date?: string; end_date?: string; estimated_duration?: number }) => Promise<void>;
  onClose: () => void;
}

export function TaskPlanner({ task, onSave, onClose }: TaskPlannerProps) {
  const [startDate, setStartDate] = useState(task.start_date || '');
  const [endDate, setEndDate] = useState(task.end_date || '');
  const [duration, setDuration] = useState(task.estimated_duration || 1);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-calculate end date when start date or duration changes
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (date && duration) {
      const start = parseISO(date);
      const end = addDays(start, duration - 1);
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  const handleDurationChange = (days: number) => {
    setDuration(days);
    if (startDate && days) {
      const start = parseISO(startDate);
      const end = addDays(start, days - 1);
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    if (startDate && date) {
      const start = parseISO(startDate);
      const end = parseISO(date);
      const days = differenceInDays(end, start) + 1;
      if (days > 0) {
        setDuration(days);
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(task.id, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        estimated_duration: duration,
      });
      onClose();
    } catch (error) {
      console.error('Error saving task planning:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    return [
      { label: 'Aujourd\'hui', date: today },
      { label: 'Demain', date: addDays(today, 1) },
      { label: 'Dans 3 jours', date: addDays(today, 3) },
      { label: 'Dans 1 semaine', date: addDays(today, 7) },
      { label: 'Dans 2 semaines', date: addDays(today, 14) },
    ];
  };

  const getDurationPresets = () => {
    return [
      { label: '½ jour', value: 0.5 },
      { label: '1 jour', value: 1 },
      { label: '2 jours', value: 2 },
      { label: '3 jours', value: 3 },
      { label: '1 semaine', value: 7 },
      { label: '2 semaines', value: 14 },
    ];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Planifier la tâche</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{task.title}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Warning if no dates */}
          {!startDate && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Tâche non planifiée</p>
                <p>Définissez une date de début pour que cette tâche apparaisse dans le calendrier et la timeline.</p>
              </div>
            </div>
          )}

          {/* Quick Date Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">📅 Démarrage rapide</label>
            <div className="flex flex-wrap gap-2">
              {getQuickDateOptions().map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartDateChange(format(option.date, 'yyyy-MM-dd'))}
                  className={startDate === format(option.date, 'yyyy-MM-dd') ? 'border-blue-500 bg-blue-50' : ''}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-sm font-medium mb-3">⏱️ Durée estimée</label>
            <div className="flex flex-wrap gap-2">
              {getDurationPresets().map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDurationChange(preset.value)}
                  className={duration === preset.value ? 'border-blue-500 bg-blue-50' : ''}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-6" />

          {/* Manual Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de début
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full"
              />
              {startDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {format(parseISO(startDate), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                min={startDate || undefined}
                className="w-full"
              />
              {endDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {format(parseISO(endDate), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              )}
            </div>
          </div>

          {/* Duration Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Durée (jours)
            </label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
              min="0.5"
              step="0.5"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {duration === 0.5 ? 'Une demi-journée' : duration === 1 ? 'Une journée' : `${duration} jours`}
            </p>
          </div>

          {/* Summary */}
          {startDate && endDate && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">📋 Résumé de la planification</p>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• Début : {format(parseISO(startDate), 'd MMMM yyyy', { locale: fr })}</p>
                <p>• Fin : {format(parseISO(endDate), 'd MMMM yyyy', { locale: fr })}</p>
                <p>• Durée : {duration} jour{duration > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? 'Enregistrement...' : 'Enregistrer la planification'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


