import { getProjectById, getPurchasesByProjectId } from './db-mongo';
import type { PurchaseStatus, TaskPriority, TaskStatus } from './types';

/**
 * Construit un contexte riche et structuré du projet pour l'IA
 */
export async function buildProjectContext(projectId: string): Promise<string> {
  // Récupérer toutes les données du projet avec rooms et tasks
  const projectData = await getProjectById(projectId);

  if (!projectData) {
    return 'Projet non trouvé.';
  }

  const rooms = projectData.rooms;
  const tasks = rooms.flatMap(room => 
    room.tasks.map(task => ({
      ...task,
      room_name: room.name,
      room_id: room.id,
    }))
  );

  const purchases = await getPurchasesByProjectId(projectId);

  // Calculer les statistiques
  const stats = calculateProjectStats(
    { total_budget: projectData.total_budget || 0 },
    rooms,
    tasks,
    purchases
  );

  // Construire le contexte structuré
  return `
# CONTEXTE DU PROJET

## Informations Générales
- **Nom**: ${projectData.name}
- **Description**: ${projectData.description || 'Aucune description'}
- **Date de création**: ${new Date(projectData.created_at).toLocaleDateString('fr-FR')}

## Budget
- **Budget total**: ${formatMoney(projectData.total_budget || 0)}
- **Budget alloué**: ${formatMoney(stats.totalAllocated)}
- **Coût estimé**: ${formatMoney(stats.totalEstimatedCost)}
- **Dépenses réelles**: ${formatMoney(stats.totalActualCost)}
- **Achats effectués**: ${formatMoney(stats.totalPurchased)}
- **Budget utilisé**: ${stats.budgetUsagePercent.toFixed(1)}%
${stats.budgetUsagePercent > 90 ? '⚠️ **ALERTE**: Budget presque épuisé!' : ''}
${stats.budgetUsagePercent > 100 ? '🚨 **URGENT**: Budget dépassé de ' + (stats.budgetUsagePercent - 100).toFixed(1) + '%!' : ''}

## Pièces (${rooms.length})
${rooms.map(room => {
  const roomTasks = tasks.filter(t => t.room_id === room.id);
  const completedTasks = roomTasks.filter(t => t.status === 'completed').length;
  return `- **${room.name}**: ${roomTasks.length} tâche(s) (${completedTasks} terminée(s))${room.surface_area ? ` - ${room.surface_area}m²` : ''}${room.allocated_budget ? ` - Budget: ${formatMoney(room.allocated_budget)}` : ''}`;
}).join('\n') || 'Aucune pièce créée'}

## Tâches (${tasks.length})
${stats.tasksByStatus.map(s => `- ${s.label}: ${s.count} tâche(s)`).join('\n')}

### Tâches Prioritaires
${tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 5).map(t => 
  `- [${t.status.toUpperCase()}] ${t.title} (${t.room_name}) - ${t.priority === 'urgent' ? '🔴 URGENT' : '🟠 Haute'}`
).join('\n') || 'Aucune tâche prioritaire'}

### Tâches Bloquées
${tasks.filter(t => t.status === 'blocked').map(t => 
  `- ${t.title} (${t.room_name})`
).join('\n') || 'Aucune tâche bloquée'}

## Achats (${purchases.length})
- **Planifiés**: ${purchases.filter(p => p.status === 'planned').length}
- **Dans le panier**: ${purchases.filter(p => p.status === 'in_cart').length}
- **Achetés**: ${purchases.filter(p => p.status === 'purchased').length}
- **Total dépensé en achats**: ${formatMoney(stats.totalPurchased)}

## Progression Globale
- **Avancement tâches**: ${stats.taskCompletionPercent.toFixed(1)}%
- **Avancement achats**: ${stats.purchaseCompletionPercent.toFixed(1)}%
- **Progression générale**: ${stats.overallProgress.toFixed(1)}%

## Risques & Alertes
${stats.risks.join('\n') || '✅ Aucun risque détecté'}

---
**Note**: Ce contexte est mis à jour automatiquement à chaque requête.
`;
}

/**
 * Calcule les statistiques du projet
 */
function calculateProjectStats(
  project: { total_budget: number },
  rooms: Array<{ allocated_budget?: number }>,
  tasks: Array<{
    estimated_cost?: number;
    actual_cost?: number;
    status: TaskStatus;
    priority: TaskPriority;
  }>,
  purchases: Array<{ status: PurchaseStatus; total_price: number }>
) {
  const totalAllocated = rooms.reduce((sum, r) => sum + (r.allocated_budget || 0), 0);
  const totalEstimatedCost = tasks.reduce((sum, t) => sum + (t.estimated_cost || 0), 0);
  const totalActualCost = tasks.reduce((sum, t) => sum + (t.actual_cost || 0), 0);
  const totalPurchased = purchases.filter(p => p.status === 'purchased').reduce((sum, p) => sum + p.total_price, 0);
  
  const totalSpent = totalActualCost + totalPurchased;
  const budgetUsagePercent = project.total_budget > 0 ? (totalSpent / project.total_budget) * 100 : 0;

  const tasksByStatus = [
    { label: 'À faire', count: tasks.filter(t => t.status === 'todo').length },
    { label: 'En cours', count: tasks.filter(t => t.status === 'in_progress').length },
    { label: 'Terminées', count: tasks.filter(t => t.status === 'completed').length },
    { label: 'Bloquées', count: tasks.filter(t => t.status === 'blocked').length },
  ];

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const taskCompletionPercent = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const purchasedCount = purchases.filter(p => p.status === 'purchased').length;
  const purchaseCompletionPercent = purchases.length > 0 ? (purchasedCount / purchases.length) * 100 : 0;

  const overallProgress = (taskCompletionPercent * 0.7) + (purchaseCompletionPercent * 0.3);

  // Détection de risques
  const risks = [];
  if (budgetUsagePercent > 100) {
    risks.push(`🚨 **URGENT**: Budget dépassé de ${(budgetUsagePercent - 100).toFixed(1)}%`);
  } else if (budgetUsagePercent > 90) {
    risks.push(`⚠️ **Attention**: Plus de 90% du budget utilisé`);
  }

  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  if (blockedTasks.length > 0) {
    risks.push(`⚠️ ${blockedTasks.length} tâche(s) bloquée(s)`);
  }

  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
  if (urgentTasks.length > 0) {
    risks.push(`🔴 ${urgentTasks.length} tâche(s) urgente(s) non terminée(s)`);
  }

  return {
    totalAllocated,
    totalEstimatedCost,
    totalActualCost,
    totalPurchased,
    totalSpent,
    budgetUsagePercent,
    tasksByStatus,
    taskCompletionPercent,
    purchaseCompletionPercent,
    overallProgress,
    risks,
  };
}

/**
 * Formate un montant en euros
 */
function formatMoney(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Construit le contexte des pièces disponibles pour l'IA
 */
export async function buildRoomsContext(projectId: string): Promise<string> {
  const projectData = await getProjectById(projectId);

  if (!projectData || projectData.rooms.length === 0) {
    return 'Aucune pièce créée pour ce projet. L\'utilisateur doit d\'abord créer des pièces avant d\'ajouter des tâches.';
  }

  const rooms = projectData.rooms;

  return `
PIÈCES DISPONIBLES:
${rooms.map(r => `- ID: ${r.id} | Nom: "${r.name}"${r.description ? ` | Description: ${r.description}` : ''}${r.surface_area ? ` | Surface: ${r.surface_area}m²` : ''}`).join('\n')}

Pour ajouter une tâche, utilise l'ID de la pièce correspondante.
`;
}

