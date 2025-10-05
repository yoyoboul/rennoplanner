'use client';

import { Card, CardContent } from './ui/card';
import { DollarSign, CheckCircle2, ShoppingCart, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ProjectWithDetails, PurchaseWithDetails } from '@/lib/types';
import { useMemo } from 'react';

interface KPICardsProps {
  project: ProjectWithDetails;
  purchases: PurchaseWithDetails[];
}

export function KPICards({ project, purchases }: KPICardsProps) {
  const stats = useMemo(() => {
    const totalBudget = project.total_budget || 0;
    const totalAllocated = project.rooms.reduce((sum, room) => sum + (room.allocated_budget || 0), 0);
    
    const totalPurchased = purchases
      .filter(p => p.status === 'purchased')
      .reduce((sum, p) => sum + p.total_price, 0);
    
    const totalSpent = totalPurchased + project.rooms.reduce((sum, room) => 
      sum + room.tasks.reduce((taskSum, task) => taskSum + (task.actual_cost || 0), 0), 0
    );

    const budgetUsedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const allTasks = project.rooms.flatMap(r => r.tasks);
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const totalTasks = allTasks.length;
    const tasksPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalPurchases = purchases.length;
    const purchasedCount = purchases.filter(p => p.status === 'purchased').length;
    const purchasesPercent = totalPurchases > 0 ? (purchasedCount / totalPurchases) * 100 : 0;

    const overallProgress = totalTasks > 0 
      ? ((completedTasks / totalTasks) * 0.7 + (purchasedCount / Math.max(totalPurchases, 1)) * 0.3) * 100 
      : 0;

    return {
      budget: {
        used: totalSpent,
        total: totalBudget,
        percent: budgetUsedPercent,
        status: budgetUsedPercent > 100 ? 'danger' : budgetUsedPercent > 80 ? 'warning' : 'success',
      },
      tasks: {
        completed: completedTasks,
        total: totalTasks,
        percent: tasksPercent,
      },
      purchases: {
        purchased: purchasedCount,
        total: totalPurchases,
        percent: purchasesPercent,
      },
      progress: {
        percent: overallProgress,
      },
    };
  }, [project, purchases]);

  const getBudgetColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return 'text-blue-600 bg-blue-50';
    if (percent >= 50) return 'text-purple-600 bg-purple-50';
    if (percent >= 25) return 'text-indigo-600 bg-indigo-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Budget Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Budget Utilisé</p>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.budget.percent.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(stats.budget.used)} / {formatCurrency(stats.budget.total)}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${getBudgetColor(stats.budget.status)}`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                stats.budget.status === 'danger' ? 'bg-red-600' :
                stats.budget.status === 'warning' ? 'bg-orange-600' : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(stats.budget.percent, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Tâches Complétées</p>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.tasks.completed}/{stats.tasks.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.tasks.percent.toFixed(0)}% terminées
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${stats.tasks.percent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Purchases Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Achats Effectués</p>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.purchases.purchased}/{stats.purchases.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.purchases.percent.toFixed(0)}% achetés
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${stats.purchases.percent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Progression Globale</p>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.progress.percent.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.progress.percent >= 75 ? 'Presque terminé !' :
                   stats.progress.percent >= 50 ? 'Bon avancement' :
                   stats.progress.percent >= 25 ? 'En cours' : 'Démarrage'}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${getProgressColor(stats.progress.percent)}`}>
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${stats.progress.percent}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

