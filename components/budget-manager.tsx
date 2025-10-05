'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Save, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { ProjectWithDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

interface BudgetManagerProps {
  project: ProjectWithDetails;
  onClose: () => void;
}

export function BudgetManager({ project, onClose }: BudgetManagerProps) {
  const { updateProject, updateRoom, purchases, fetchPurchases } = useStore();
  const [totalBudget, setTotalBudget] = useState(project.total_budget?.toString() || '0');

  useEffect(() => {
    fetchPurchases(project.id);
  }, [project.id, fetchPurchases]);
  const [roomBudgets, setRoomBudgets] = useState<Record<string | number, string>>(
    project.rooms.reduce((acc, room) => {
      // Utiliser allocated_budget si disponible, sinon utiliser les coûts estimés
      const budget = room.allocated_budget
        ? room.allocated_budget.toString()
        : room.tasks.reduce((sum, task) => sum + (task.estimated_cost || 0), 0).toString();
      acc[room.id] = budget;
      return acc;
    }, {} as Record<string | number, string>)
  );

  const totalAllocated = useMemo(() => {
    return Object.values(roomBudgets).reduce((sum, budget) => sum + (parseFloat(budget) || 0), 0);
  }, [roomBudgets]);

  const totalPurchases = useMemo(() => {
    return purchases
      .filter(p => p.status === 'purchased')
      .reduce((sum, p) => sum + p.total_price, 0);
  }, [purchases]);

  const budgetRemaining = parseFloat(totalBudget) - totalAllocated;

  const handleSave = async () => {
    // Mettre à jour le budget total du projet
    await updateProject(project.id, {
      total_budget: parseFloat(totalBudget),
    });

    // Mettre à jour le budget alloué pour chaque pièce
    for (const [roomId, budget] of Object.entries(roomBudgets)) {
      await updateRoom(roomId, {
        allocated_budget: parseFloat(budget),
      });
    }

    toast.success('Budget mis à jour avec succès !');
    onClose();
  };

  const handleAutoAllocate = () => {
    const budget = parseFloat(totalBudget);
    if (budget <= 0 || project.rooms.length === 0) return;

    // Calculer les coûts estimés actuels par pièce
    const roomCosts = project.rooms.map(room => ({
      id: room.id,
      estimatedCost: room.tasks.reduce((sum, task) => sum + (task.estimated_cost || 0), 0),
    }));

    const totalEstimated = roomCosts.reduce((sum, room) => sum + room.estimatedCost, 0);

    if (totalEstimated === 0) {
      // Si pas d'estimation, répartir équitablement
      const perRoom = budget / project.rooms.length;
      const newBudgets: Record<string | number, string> = {};
      project.rooms.forEach(room => {
        newBudgets[room.id] = perRoom.toFixed(2);
      });
      setRoomBudgets(newBudgets);
    } else {
      // Répartir proportionnellement aux estimations
      const newBudgets: Record<string | number, string> = {};
      roomCosts.forEach(({ id, estimatedCost }) => {
        const proportion = estimatedCost / totalEstimated;
        newBudgets[id] = (budget * proportion).toFixed(2);
      });
      setRoomBudgets(newBudgets);
    }

    toast.success('Budget alloué automatiquement !');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Gestion du Budget
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Budget Total */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Budget Total du Projet</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="50000"
                  min="0"
                  step="100"
                  className="text-lg font-semibold"
                />
                <Button variant="outline" onClick={handleAutoAllocate}>
                  Répartir Auto
                </Button>
              </div>
            </div>

            {/* Résumé */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Budget Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(parseFloat(totalBudget) || 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Alloué</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalAllocated)}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Dépensé (Achats)</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalPurchases)}</p>
                </CardContent>
              </Card>
              <Card className={budgetRemaining >= 0 ? 'bg-green-50' : 'bg-red-50'}>
                <CardContent className="p-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Restant</p>
                    <p className={`text-2xl font-bold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budgetRemaining)}
                    </p>
                  </div>
                  {budgetRemaining >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Budget par pièce */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Budget par Pièce</h3>
            <div className="space-y-3">
              {project.rooms.map((room) => {
                const estimatedCost = room.tasks.reduce((sum, task) => sum + (task.estimated_cost || 0), 0);
                const actualCost = room.tasks.reduce((sum, task) => sum + (task.actual_cost || 0), 0);
                const roomPurchases = purchases
                  .filter(p => p.room_id === room.id && p.status === 'purchased')
                  .reduce((sum, p) => sum + p.total_price, 0);
                const totalSpent = actualCost + roomPurchases;
                const allocated = parseFloat(roomBudgets[room.id] || '0');
                const percentOfTotal = parseFloat(totalBudget) > 0
                  ? (allocated / parseFloat(totalBudget)) * 100
                  : 0;

                return (
                  <Card key={room.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{room.name}</h4>
                            <p className="text-xs text-gray-500">
                              {room.tasks.length} tâche{room.tasks.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <Input
                              type="number"
                              value={roomBudgets[room.id] || '0'}
                              onChange={(e) => setRoomBudgets({ ...roomBudgets, [room.id]: e.target.value })}
                              className="w-32 text-right font-semibold"
                              min="0"
                              step="10"
                            />
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Budget alloué</span>
                            <span>{percentOfTotal.toFixed(1)}% du total</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(percentOfTotal, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Détails des coûts */}
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Estimé</p>
                            <p className="font-medium">{formatCurrency(estimatedCost)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Achats</p>
                            <p className="font-medium text-purple-600">{formatCurrency(roomPurchases)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total dépensé</p>
                            <p className="font-medium text-orange-600">{formatCurrency(totalSpent)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Marge</p>
                            <p className={`font-medium ${allocated - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(allocated - totalSpent)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Conseils */}
          {budgetRemaining < 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Attention :</strong> Le budget alloué dépasse le budget total de {formatCurrency(Math.abs(budgetRemaining))}
                </p>
              </CardContent>
            </Card>
          )}

          {budgetRemaining > parseFloat(totalBudget) * 0.5 && parseFloat(totalBudget) > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Astuce :</strong> Plus de 50% du budget n&apos;est pas alloué. Utilisez &quot;Répartir Auto&quot; pour une répartition optimale.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>

        <div className="border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </Card>
    </div>
  );
}
