'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  Edit2,
  Package,
  ListChecks,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PurchaseStatus, PurchaseWithDetails, PurchaseItemType } from '@/lib/types';
import type { ProjectWithDetails } from '@/lib/types';
import { useConfirmDialog } from './confirm-dialog';

interface ShoppingListProps {
  project: ProjectWithDetails;
}

export function ShoppingList({ project }: ShoppingListProps) {
  const { purchases, fetchPurchases, createPurchase, updatePurchase, deletePurchase } = useStore();
  const { confirm, dialog } = useConfirmDialog();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    planned: true,
    in_cart: true,
    purchased: false,
  });

  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    quantity: '1',
    unit_price: '',
    category: '',
    item_type: 'materiaux' as PurchaseItemType,
    supplier: '',
    room_id: '',
    task_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchPurchases(project.id);
  }, [project.id, fetchPurchases]);

  const resetForm = () => {
    setFormData({
      item_name: '',
      description: '',
      quantity: '1',
      unit_price: '',
      category: '',
      item_type: 'materiaux' as PurchaseItemType,
      supplier: '',
      room_id: '',
      task_id: '',
      notes: '',
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      project_id: project.id,
      item_name: formData.item_name,
      description: formData.description || undefined,
      quantity: parseFloat(formData.quantity) || 1,
      unit_price: parseFloat(formData.unit_price) || 0,
      category: formData.category || undefined,
      item_type: formData.item_type,
      supplier: formData.supplier || undefined,
      room_id: formData.room_id || undefined,
      task_id: formData.task_id || undefined,
      notes: formData.notes || undefined,
      status: 'planned' as PurchaseStatus,
    };

    if (editingId) {
      await updatePurchase(editingId, data);
    } else {
      await createPurchase(data);
    }
    resetForm();
  };

  const handleEdit = (purchase: PurchaseWithDetails) => {
    setFormData({
      item_name: purchase.item_name,
      description: purchase.description || '',
      quantity: purchase.quantity.toString(),
      unit_price: purchase.unit_price.toString(),
      category: purchase.category || '',
      item_type: purchase.item_type,
      supplier: purchase.supplier || '',
      room_id: purchase.room_id?.toString() || '',
      task_id: purchase.task_id?.toString() || '',
      notes: purchase.notes || '',
    });
    setEditingId(purchase.id);
    setShowAddForm(true);
  };

  const handleStatusChange = async (id: string | number, status: PurchaseStatus) => {
    const updateData: { status: PurchaseStatus; purchase_date?: string } = { status };
    if (status === 'purchased') {
      updateData.purchase_date = new Date().toISOString().split('T')[0];
    }
    await updatePurchase(id, updateData);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const groupedPurchases = {
    planned: purchases.filter((p) => p.status === 'planned'),
    in_cart: purchases.filter((p) => p.status === 'in_cart'),
    purchased: purchases.filter((p) => p.status === 'purchased'),
  };

  // Group by type within each status
  const groupedByType = {
    planned: {
      materiaux: groupedPurchases.planned.filter((p) => p.item_type === 'materiaux'),
      meubles: groupedPurchases.planned.filter((p) => p.item_type === 'meubles'),
    },
    in_cart: {
      materiaux: groupedPurchases.in_cart.filter((p) => p.item_type === 'materiaux'),
      meubles: groupedPurchases.in_cart.filter((p) => p.item_type === 'meubles'),
    },
    purchased: {
      materiaux: groupedPurchases.purchased.filter((p) => p.item_type === 'materiaux'),
      meubles: groupedPurchases.purchased.filter((p) => p.item_type === 'meubles'),
    },
  };

  const totals = {
    planned: groupedPurchases.planned.reduce((sum, p) => sum + p.total_price, 0),
    in_cart: groupedPurchases.in_cart.reduce((sum, p) => sum + p.total_price, 0),
    purchased: groupedPurchases.purchased.reduce((sum, p) => sum + p.total_price, 0),
  };

  const grandTotal = totals.planned + totals.in_cart + totals.purchased;

  const renderPurchaseCard = (purchase: PurchaseWithDetails) => (
    <Card key={purchase.id} className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">{purchase.item_name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    purchase.item_type === 'meubles' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {purchase.item_type === 'meubles' ? '🪑 Meubles' : '🧱 Matériaux'}
                  </span>
                </div>
                {purchase.description && (
                  <p className="text-sm text-gray-600 mt-1">{purchase.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(purchase.total_price)}
                </p>
                <p className="text-xs text-gray-500">
                  {purchase.quantity} × {formatCurrency(purchase.unit_price)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
              {purchase.category && (
                <div>
                  <span className="font-medium">Catégorie:</span> {purchase.category}
                </div>
              )}
              {purchase.supplier && (
                <div>
                  <span className="font-medium">Fournisseur:</span> {purchase.supplier}
                </div>
              )}
              {purchase.room_name && (
                <div>
                  <span className="font-medium">Pièce:</span> {purchase.room_name}
                </div>
              )}
              {purchase.task_title && (
                <div>
                  <span className="font-medium">Tâche:</span> {purchase.task_title}
                </div>
              )}
              {purchase.purchase_date && (
                <div>
                  <span className="font-medium">Date d&apos;achat:</span>{' '}
                  {formatDate(purchase.purchase_date)}
                </div>
              )}
            </div>

            {purchase.notes && (
              <p className="text-xs text-gray-500 mt-2 italic">📝 {purchase.notes}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {purchase.status === 'planned' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(purchase.id, 'in_cart')}
                className="gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                Panier
              </Button>
            )}
            {purchase.status === 'in_cart' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(purchase.id, 'purchased')}
                  className="gap-1 bg-green-50 hover:bg-green-100"
                >
                  <Check className="w-3 h-3" />
                  Acheté
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(purchase.id, 'planned')}
                  className="gap-1"
                >
                  Retirer
                </Button>
              </>
            )}
            {purchase.status === 'purchased' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(purchase.id, 'in_cart')}
                className="gap-1"
              >
                Annuler
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => handleEdit(purchase)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                confirm({
                  title: 'Supprimer cet achat ?',
                  description: `Voulez-vous vraiment supprimer "${purchase.item_name}" ? Cette action est irréversible.`,
                  variant: 'danger',
                  confirmText: 'Supprimer',
                  onConfirm: () => deletePurchase(purchase.id),
                });
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {dialog}
      <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Estimé</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(grandTotal)}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600">À planifier</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.planned)}</p>
            <p className="text-xs text-gray-500">{groupedPurchases.planned.length} articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600">Dans le panier</p>
            <p className="text-lg font-semibold text-orange-600">{formatCurrency(totals.in_cart)}</p>
            <p className="text-xs text-gray-500">{groupedPurchases.in_cart.length} articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600">Acheté</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totals.purchased)}</p>
            <p className="text-xs text-gray-500">{groupedPurchases.purchased.length} articles</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
        <Plus className="w-4 h-4" />
        {showAddForm ? 'Annuler' : 'Ajouter un article'}
      </Button>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifier l\'article' : 'Ajouter un article'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom de l&apos;article *</label>
                  <Input
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="Peinture blanche 10L"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type d&apos;article *</label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-300 px-3 py-2"
                    value={formData.item_type}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value as PurchaseItemType })}
                    required
                  >
                    <option value="materiaux">🧱 Matériaux (peinture, carrelage, etc.)</option>
                    <option value="meubles">🪑 Meubles (table, chaise, etc.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Peinture, Plomberie..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantité</label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prix unitaire (€)</label>
                  <Input
                    type="number"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="45.90"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fournisseur</label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Leroy Merlin, Castorama..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pièce (optionnel)</label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-300 px-3 py-2"
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  >
                    <option value="">Sélectionner une pièce</option>
                    {project.rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes supplémentaires..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Shopping Sections */}
      <div className="space-y-4">
        {/* Planned Items */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('planned')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-gray-600" />
                À Planifier ({groupedPurchases.planned.length})
                <span className="text-sm font-normal text-gray-500">
                  • {formatCurrency(totals.planned)}
                </span>
              </CardTitle>
              {expandedSections.planned ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.planned && (
            <CardContent className="space-y-4">
              {groupedPurchases.planned.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun article à planifier</p>
              ) : (
                <>
                  {groupedByType.planned.materiaux.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        🧱 Matériaux ({groupedByType.planned.materiaux.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedByType.planned.materiaux.map(renderPurchaseCard)}
                      </div>
                    </div>
                  )}
                  {groupedByType.planned.meubles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                        🪑 Meubles ({groupedByType.planned.meubles.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedByType.planned.meubles.map(renderPurchaseCard)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* In Cart */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('in_cart')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                Dans le Panier ({groupedPurchases.in_cart.length})
                <span className="text-sm font-normal text-gray-500">
                  • {formatCurrency(totals.in_cart)}
                </span>
              </CardTitle>
              {expandedSections.in_cart ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.in_cart && (
            <CardContent className="space-y-4">
              {groupedPurchases.in_cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Panier vide</p>
              ) : (
                <>
                  {groupedByType.in_cart.materiaux.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        🧱 Matériaux ({groupedByType.in_cart.materiaux.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedByType.in_cart.materiaux.map(renderPurchaseCard)}
                      </div>
                    </div>
                  )}
                  {groupedByType.in_cart.meubles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                        🪑 Meubles ({groupedByType.in_cart.meubles.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedByType.in_cart.meubles.map(renderPurchaseCard)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* Purchased */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('purchased')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                Acheté ({groupedPurchases.purchased.length})
                <span className="text-sm font-normal text-gray-500">
                  • {formatCurrency(totals.purchased)}
                </span>
              </CardTitle>
              {expandedSections.purchased ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.purchased && (
            <CardContent className="space-y-4">
              {groupedPurchases.purchased.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun achat effectué</p>
              ) : (
                <>
                  {groupedByType.purchased.materiaux.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        🧱 Matériaux ({groupedByType.purchased.materiaux.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedByType.purchased.materiaux.map(renderPurchaseCard)}
                      </div>
                    </div>
                  )}
                  {groupedByType.purchased.meubles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                        🪑 Meubles ({groupedByType.purchased.meubles.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedByType.purchased.meubles.map(renderPurchaseCard)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
    </>
  );
}
