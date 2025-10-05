'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { ProjectWithDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Euro } from 'lucide-react';

interface ProjectStatsProps {
  project: ProjectWithDetails;
}

export function ProjectStats({ project }: ProjectStatsProps) {
  const allTasks = project.rooms.flatMap((r) => r.tasks);
  const progressPercentage = project.total_tasks > 0
    ? Math.round((project.completed_tasks / project.total_tasks) * 100)
    : 0;

  const inProgressCount = allTasks.filter((t) => t.status === 'in_progress').length;
  const blockedCount = allTasks.filter((t) => t.status === 'blocked').length;
  const totalEstimated = allTasks.reduce((sum, t) => sum + (t.estimated_cost || 0), 0);

  const stats = [
    {
      title: 'Tâches terminées',
      value: `${project.completed_tasks}/${project.total_tasks}`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'En cours',
      value: inProgressCount.toString(),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Bloquées',
      value: blockedCount.toString(),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Progression',
      value: `${progressPercentage}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Budget total</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(project.total_budget || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Coût estimé</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(totalEstimated)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Dépensé</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(project.total_spent)}
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Reste</span>
                  <span className={`font-bold text-lg ${
                    (project.total_budget || 0) - project.total_spent >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatCurrency((project.total_budget || 0) - project.total_spent)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Avancement global</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pièces</span>
                  <span className="font-medium">{project.rooms.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tâches totales</span>
                  <span className="font-medium">{project.total_tasks}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
