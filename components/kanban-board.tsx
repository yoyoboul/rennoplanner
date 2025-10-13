'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { EmptyState } from './ui/empty-state';
import type { Task, TaskStatus } from '@/lib/types';
import { cn, formatCurrency, getCategoryIcon, getStatusColor, getPriorityColor } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const { updateTask } = useStore();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<TaskStatus>('todo');
  const cardRefs = useRef<Map<string | number, HTMLDivElement>>(new Map());

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'À faire', color: 'bg-gray-50' },
    { status: 'in_progress', title: 'En cours', color: 'bg-blue-50' },
    { status: 'completed', title: 'Terminé', color: 'bg-green-50' },
    { status: 'blocked', title: 'Bloqué', color: 'bg-red-50' },
  ];

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: TaskStatus) => {
    if (draggedTask && draggedTask.status !== status) {
      await updateTask(draggedTask.id, { status });
    }
    setDraggedTask(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTaskId) return;

      const columns: TaskStatus[] = ['todo', 'in_progress', 'completed', 'blocked'];
      const currentColumnIndex = columns.indexOf(selectedColumn);
      const currentColumnTasks = getTasksByStatus(selectedColumn);
      const currentTaskIndex = currentColumnTasks.findIndex(t => t.id === selectedTaskId);

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentTaskIndex > 0) {
            const prevTask = currentColumnTasks[currentTaskIndex - 1];
            setSelectedTaskId(prevTask.id);
            cardRefs.current.get(prevTask.id)?.focus();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentTaskIndex < currentColumnTasks.length - 1) {
            const nextTask = currentColumnTasks[currentTaskIndex + 1];
            setSelectedTaskId(nextTask.id);
            cardRefs.current.get(nextTask.id)?.focus();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentColumnIndex > 0) {
            const prevColumn = columns[currentColumnIndex - 1];
            const prevColumnTasks = getTasksByStatus(prevColumn);
            if (prevColumnTasks.length > 0) {
              setSelectedColumn(prevColumn);
              setSelectedTaskId(prevColumnTasks[0].id);
              cardRefs.current.get(prevColumnTasks[0].id)?.focus();
            }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentColumnIndex < columns.length - 1) {
            const nextColumn = columns[currentColumnIndex + 1];
            const nextColumnTasks = getTasksByStatus(nextColumn);
            if (nextColumnTasks.length > 0) {
              setSelectedColumn(nextColumn);
              setSelectedTaskId(nextColumnTasks[0].id);
              cardRefs.current.get(nextColumnTasks[0].id)?.focus();
            }
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Move task to next column
          if (currentColumnIndex < columns.length - 1) {
            const nextColumn = columns[currentColumnIndex + 1];
            const task = currentColumnTasks[currentTaskIndex];
            updateTask(task.id, { status: nextColumn });
            setSelectedColumn(nextColumn);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, selectedColumn, tasks, updateTask]);

  // Empty state
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune tâche pour le moment"
        description="Créez votre première tâche pour commencer à organiser votre projet."
      />
    );
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      role="region"
      aria-label="Tableau Kanban"
    >
      {columns.map((column) => (
        <div
          key={column.status}
          className={cn('rounded-lg p-4 min-h-[500px]', column.color)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.status)}
          role="region"
          aria-label={`Colonne ${column.title}`}
        >
          <h3 
            className="font-semibold text-lg mb-4 flex items-center justify-between"
            id={`column-${column.status}`}
          >
            {column.title}
            <span className="text-sm font-normal text-gray-500" aria-label={`${getTasksByStatus(column.status).length} tâches`}>
              {getTasksByStatus(column.status).length}
            </span>
          </h3>

          <div className="space-y-3">
            {getTasksByStatus(column.status).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Aucune tâche
              </p>
            ) : (
              getTasksByStatus(column.status).map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card
                  ref={(el) => {
                    if (el) cardRefs.current.set(task.id, el);
                  }}
                  className={cn(
                    "cursor-move hover:shadow-md transition-shadow",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    selectedTaskId === task.id && "ring-2 ring-blue-500"
                  )}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  tabIndex={0}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setSelectedColumn(column.status);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedTaskId(task.id);
                      setSelectedColumn(column.status);
                    }
                  }}
                  role="button"
                  aria-label={`Tâche: ${task.title}, Statut: ${column.title}, Priorité: ${task.priority}`}
                  aria-describedby={`task-${task.id}-description`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full border',
                          getPriorityColor(task.priority)
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                    {task.description && (
                      <p 
                        id={`task-${task.id}-description`}
                        className="text-xs text-gray-600 mb-2 line-clamp-2"
                      >
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                      {task.estimated_cost && task.estimated_cost > 0 ? (
                        <span className="font-medium text-blue-600">
                          {formatCurrency(task.estimated_cost)}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                      {task.estimated_duration && (
                        <span>{task.estimated_duration}j</span>
                      )}
                    </div>

                    <div className="mt-2">
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded border inline-block',
                          getStatusColor(task.status)
                        )}
                      >
                        {task.category}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
