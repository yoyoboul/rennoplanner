'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Search, Hash, Home, ShoppingCart, MessageSquare, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { formatCurrency, getCategoryIcon } from '@/lib/utils';
import type { ProjectWithDetails, Task, PurchaseWithDetails } from '@/lib/types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectWithDetails;
  purchases?: PurchaseWithDetails[];
}

type SearchResult = {
  type: 'task' | 'room' | 'purchase' | 'action';
  id: string | number;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  action: () => void;
  metadata?: string;
};

export function GlobalSearch({ isOpen, onClose, project, purchases = [] }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Reset quand on ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Construire tous les résultats possibles
  const allResults = useMemo(() => {
    const results: SearchResult[] = [];

    if (!project) return results;

    // Actions rapides
    results.push({
      type: 'action',
      id: 'new-task',
      title: 'Créer une nouvelle tâche',
      subtitle: 'Ajouter une tâche au projet',
      icon: Hash,
      iconColor: 'text-blue-600',
      action: () => {
        // Trigger l'ajout de tâche
        onClose();
      },
    });

    results.push({
      type: 'action',
      id: 'new-purchase',
      title: 'Ajouter un achat',
      subtitle: 'Ajouter à la liste de courses',
      icon: ShoppingCart,
      iconColor: 'text-green-600',
      action: () => {
        router.push(`/project/${project.id}?view=shopping`);
        onClose();
      },
    });

    // Pièces
    project.rooms.forEach((room) => {
      results.push({
        type: 'room',
        id: room.id,
        title: room.name,
        subtitle: `${room.tasks.length} tâches • ${room.surface_area || 0}m²`,
        icon: Home,
        iconColor: 'text-purple-600',
        metadata: room.description || '',
        action: () => {
          router.push(`/project/${project.id}?room=${room.id}`);
          onClose();
        },
      });

      // Tâches de cette pièce
      room.tasks.forEach((task) => {
        results.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: `${room.name} • ${task.category}`,
          icon: () => <span className="text-xl">{getCategoryIcon(task.category)}</span>,
          iconColor: task.status === 'completed' ? 'text-green-600' : 'text-gray-600',
          metadata: task.description || '',
          action: () => {
            router.push(`/project/${project.id}?task=${task.id}`);
            onClose();
          },
        });
      });
    });

    // Achats
    purchases.forEach((purchase) => {
      results.push({
        type: 'purchase',
        id: purchase.id,
        title: purchase.item_name,
        subtitle: `${formatCurrency(purchase.total_price)} • ${purchase.status}`,
        icon: ShoppingCart,
        iconColor: purchase.status === 'purchased' ? 'text-green-600' : 'text-orange-600',
        metadata: purchase.description || '',
        action: () => {
          router.push(`/project/${project.id}?view=shopping&purchase=${purchase.id}`);
          onClose();
        },
      });
    });

    return results;
  }, [project, purchases, router, onClose]);

  // Filtrer les résultats selon la recherche
  const filteredResults = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 10);

    const lowercaseQuery = query.toLowerCase();
    return allResults.filter((result) => {
      const searchText = [
        result.title,
        result.subtitle,
        result.metadata,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchText.includes(lowercaseQuery);
    }).slice(0, 10);
  }, [query, allResults]);

  // Navigation clavier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault();
        filteredResults[selectedIndex].action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredResults, selectedIndex]);

  // Reset selected index quand les résultats changent
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-24"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <Card className="overflow-hidden shadow-2xl">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher tâches, pièces, achats..."
                className="border-0 focus:ring-0 text-lg"
              />
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredResults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aucun résultat trouvé</p>
                  {query && <p className="text-sm mt-1">Essayez un autre terme de recherche</p>}
                </div>
              ) : (
                <div className="py-2">
                  {filteredResults.map((result, index) => {
                    const Icon = result.icon;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={result.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 ${result.iconColor || 'text-gray-400'}`}>
                          {typeof Icon === 'function' ? <Icon /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-sm text-gray-500">{result.subtitle}</p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↵</kbd>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white rounded">↑</kbd>
                  <kbd className="px-2 py-1 bg-white rounded">↓</kbd>
                  <span>naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white rounded">↵</kbd>
                  <span>sélectionner</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white rounded">esc</kbd>
                  <span>fermer</span>
                </span>
              </div>
              <span>{filteredResults.length} résultat(s)</span>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook pour gérer l'ouverture de la recherche globale
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K ou Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

