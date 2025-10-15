'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  ShoppingCart,
  Package,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import type { ShoppingSession } from '@/lib/types';
import type { ProjectWithDetails } from '@/lib/types';
import { useConfirmDialog } from './confirm-dialog';
import { SlideOver } from './slide-over';
import { format, parseISO, isBefore, startOfToday, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ShoppingSessionsListProps {
  project: ProjectWithDetails;
}

interface SessionWithStats extends ShoppingSession {
  total_items: number;
  total_amount: number;
  purchased_items: number;
  purchased_amount: number;
  status: 'planned' | 'partial' | 'completed';
}

export function ShoppingSessionsList({ project }: ShoppingSessionsListProps) {
  const { 
    shoppingSessions,
    purchases,
    fetchShoppingSessions,
    fetchPurchases,
    createShoppingSession,
    updateShoppingSession,
    deleteShoppingSession,
  } = useStore();
  
  const { confirm, dialog } = useConfirmDialog();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Record<string | number, boolean>>({});
  
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    notes: '',
  });

  useEffect(() => {
    fetchShoppingSessions(project.id);
    fetchPurchases(project.id);
  }, [project.id, fetchShoppingSessions, fetchPurchases]);

  // Calculer les statistiques pour chaque session
  const sessionsWithStats = useMemo((): SessionWithStats[] => {
    return shoppingSessions.map(session => {
      const sessionPurchases = purchases.filter(p => p.shopping_session_id === session.id);
      const total_items = sessionPurchases.length;
      const total_amount = sessionPurchases.reduce((sum, p) => sum + p.total_price, 0);
      const purchased_items = sessionPurchases.filter(p => p.status === 'purchased').length;
      const purchased_amount = sessionPurchases
        .filter(p => p.status === 'purchased')
        .reduce((sum, p) => sum + p.total_price, 0);
      
      let status: 'planned' | 'partial' | 'completed' = 'planned';
      if (total_items > 0) {
        if (purchased_items === total_items) {
          status = 'completed';
        } else if (purchased_items > 0) {
          status = 'partial';
        }
      }
      
      return {
        ...session,
        total_items,
        total_amount,
        purchased_items,
        purchased_amount,
        status,
      };
    });
  }, [shoppingSessions, purchases]);

  // Grouper par mois
  const sessionsByMonth = useMemo(() => {
    const grouped: Record<string, SessionWithStats[]> = {};
    sessionsWithStats.forEach(session => {
      const date = parseISO(session.date);
      const monthKey = format(date, 'MMMM yyyy', { locale: fr });
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(session);
    });
    
    // Trier chaque groupe par date
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return grouped;
  }, [sessionsWithStats]);

  const resetForm = () => {
    setFormData({
      date: '',
      name: '',
      notes: '',
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      project_id: project.id,
      date: formData.date,
      name: formData.name || undefined,
      notes: formData.notes || undefined,
    };

    if (editingId) {
      await updateShoppingSession(editingId, data);
    } else {
      await createShoppingSession(data);
    }
    resetForm();
  };

  const handleEdit = (session: ShoppingSession) => {
    setFormData({
      date: session.date,
      name: session.name || '',
      notes: session.notes || '',
    });
    setEditingId(session.id);
    setShowAddForm(true);
  };

  const handleDelete = (session: SessionWithStats) => {
    const message = session.total_items > 0
      ? `Cette session contient ${session.total_items} article(s). Les articles ne seront pas supprimés mais ne seront plus associés à cette session.`
      : 'Voulez-vous vraiment supprimer cette session ?';
    
    confirm({
      title: 'Supprimer la session ?',
      description: message,
      variant: 'danger',
      confirmText: 'Supprimer',
      onConfirm: () => deleteShoppingSession(session.id),
    });
  };

  const toggleSession = (id: string | number) => {
    setExpandedSessions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSessionBadge = (session: SessionWithStats) => {
    const sessionDate = parseISO(session.date);
    const today = startOfToday();
    const daysUntil = differenceInDays(sessionDate, today);
    
    if (session.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          Complète
        </span>
      );
    }
    
    if (session.status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          <Package className="w-3 h-3" />
          En cours
        </span>
      );
    }
    
    if (isBefore(sessionDate, today)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          Passée
        </span>
      );
    }
    
    if (daysUntil <= 3 && daysUntil >= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
          <AlertCircle className="w-3 h-3" />
          Urgent ({daysUntil}j)
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
        Planifiée
      </span>
    );
  };

  const handleTogglePurchaseStatus = async (purchaseId: string | number, currentStatus: string) => {
    const newStatus = currentStatus === 'purchased' ? 'planned' : 'purchased';
    await updatePurchase(purchaseId, { status: newStatus });
  };

  const renderSessionPurchases = (session: SessionWithStats) => {
    const sessionPurchases = purchases.filter(p => p.shopping_session_id === session.id);
    
    if (sessionPurchases.length === 0) {
      return (
        <p className="text-sm text-gray-500 text-center py-4">
          Aucun article dans cette session
        </p>
      );
    }
    
    // Grouper par fournisseur
    const bySupplier = sessionPurchases.reduce((acc, p) => {
      const supplier = p.supplier || 'Sans fournisseur';
      if (!acc[supplier]) acc[supplier] = [];
      acc[supplier].push(p);
      return acc;
    }, {} as Record<string, typeof sessionPurchases>);
    
    return (
      <div className="space-y-4">
        {Object.entries(bySupplier).map(([supplier, items]) => {
          const totalSupplier = items.reduce((sum, item) => sum + item.total_price, 0);
          const purchasedCount = items.filter(i => i.status === 'purchased').length;
          
          return (
            <div key={supplier} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  {supplier}
                </h4>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {purchasedCount}/{items.length} article{items.length > 1 ? 's' : ''}
                  </div>
                  <div className="font-semibold text-blue-600">
                    {formatCurrency(totalSupplier)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                {items.map(item => (
                  <label 
                    key={item.id}
                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      item.status === 'purchased' ? 'bg-green-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.status === 'purchased'}
                      onChange={() => handleTogglePurchaseStatus(item.id, item.status)}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`font-medium ${
                          item.status === 'purchased' 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900'
                        }`}>
                          {item.item_name}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-sm text-gray-500">
                            ×{item.quantity}
                          </span>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        {item.category && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {item.category}
                          </span>
                        )}
                        {item.room_name && (
                          <span className="text-xs text-gray-500">
                            📍 {item.room_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className={`font-semibold ${
                        item.status === 'purchased' ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {formatCurrency(item.total_price)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.unit_price)}/u
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {dialog}
      
      {/* Formulaire SlideOver */}
      <SlideOver
        isOpen={showAddForm}
        onClose={resetForm}
        title={editingId ? 'Modifier la session' : 'Nouvelle session de courses'}
        description="Planifiez une session de courses pour un jour spécifique"
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
              {editingId ? 'Mettre à jour' : 'Créer la session'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Annuler
            </Button>
          </div>
        </form>
      </SlideOver>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Sessions de Courses</h2>
            <p className="text-sm text-gray-600 mt-1">
              {sessionsWithStats.length} session{sessionsWithStats.length !== 1 ? 's' : ''} planifiée{sessionsWithStats.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle session
          </Button>
        </div>

        {/* Sessions groupées par mois */}
        {Object.keys(sessionsByMonth).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Aucune session de courses planifiée
              </p>
              <Button onClick={() => setShowAddForm(true)} variant="outline">
                Créer votre première session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(sessionsByMonth).map(([month, sessions]) => (
              <div key={month}>
                <h3 className="text-lg font-semibold mb-3 capitalize">{month}</h3>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <Card key={session.id} className="overflow-hidden">
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSession(session.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <CardTitle className="text-lg">
                                {format(parseISO(session.date), 'EEEE d MMMM yyyy', { locale: fr })}
                              </CardTitle>
                              {getSessionBadge(session)}
                            </div>
                            {session.name && (
                              <p className="text-sm font-medium text-gray-700 ml-8 mb-2">{session.name}</p>
                            )}
                            
                            {/* Barre de progression et stats */}
                            <div className="ml-8 space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5 text-gray-600">
                                  <Package className="w-4 h-4" />
                                  <span className="font-medium">{session.total_items}</span> article{session.total_items !== 1 ? 's' : ''}
                                </span>
                                <span className="font-semibold text-blue-600 text-base">
                                  {formatCurrency(session.total_amount)}
                                </span>
                              </div>
                              
                              {session.total_items > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span>
                                      {session.purchased_items}/{session.total_items} article{session.purchased_items !== 1 ? 's' : ''} coché{session.purchased_items !== 1 ? 's' : ''}
                                    </span>
                                    <span className="font-medium">
                                      {Math.round((session.purchased_items / session.total_items) * 100)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className="bg-green-500 h-full transition-all duration-300 rounded-full"
                                      style={{ width: `${(session.purchased_items / session.total_items) * 100}%` }}
                                    />
                                  </div>
                                  {session.purchased_amount > 0 && (
                                    <div className="text-xs text-gray-500">
                                      {formatCurrency(session.purchased_amount)} dépensé{session.purchased_amount !== session.total_amount && ` sur ${formatCurrency(session.total_amount)}`}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(session);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(session);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {expandedSessions[session.id] ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {expandedSessions[session.id] && (
                        <CardContent className="border-t bg-gray-50">
                          {session.notes && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>Notes:</strong> {session.notes}
                              </p>
                            </div>
                          )}
                          {renderSessionPurchases(session)}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

