'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import type { Task, TaskStatus } from '@/lib/types';
import { cn, formatCurrency, getCategoryIcon, getStatusColor, getPriorityColor } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';

interface KanbanBoardProps {
  tasks: Task[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const { updateTask } = useStore();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div
          key={column.status}
          className={cn('rounded-lg p-4 min-h-[500px]', column.color)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.status)}
        >
          <h3 className="font-semibold text-lg mb-4 flex items-center justify-between">
            {column.title}
            <span className="text-sm font-normal text-gray-500">
              {getTasksByStatus(column.status).length}
            </span>
          </h3>

          <div className="space-y-3">
            {getTasksByStatus(column.status).map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card
                  className="cursor-move hover:shadow-md transition-shadow"
                  draggable
                  onDragStart={() => handleDragStart(task)}
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
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
