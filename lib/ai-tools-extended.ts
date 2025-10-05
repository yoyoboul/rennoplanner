import { getProjectById, getPurchasesByProjectId } from './db-mongo';

/**
 * Analytics & Reporting Functions - MongoDB version
 */

export async function getProjectAnalytics(projectId: string) {
  const projectData = await getProjectById(projectId);
  if (!projectData) throw new Error('Projet non trouvé');

  const rooms = projectData.rooms;
  const tasks = rooms.flatMap(room => 
    room.tasks.map(task => ({
      ...task,
      room_name: room.name,
      room_id: room.id,
    }))
  );
  
  const purchases = await getPurchasesByProjectId(projectId);

  // Statistiques de progression
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  // Budget
  const totalAllocated = rooms.reduce((sum, r) => sum + (parseFloat(r.allocated_budget?.toString() || '0')), 0);
  const totalEstimated = tasks.reduce((sum, t) => sum + (parseFloat(t.estimated_cost?.toString() || '0')), 0);
  const totalActual = tasks.reduce((sum, t) => sum + (parseFloat(t.actual_cost?.toString() || '0')), 0);
  const totalPurchased = purchases.filter(p => p.status === 'purchased').reduce((sum, p) => sum + parseFloat(p.total_price?.toString() || '0'), 0);
  const totalSpent = totalActual + totalPurchased;
  const budgetUsageRate = projectData.total_budget ? (totalSpent / parseFloat(projectData.total_budget.toString())) * 100 : 0;

  // Tâches par catégorie
  const tasksByCategory = tasks.reduce((acc: any, task: any) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});

  // Coûts par pièce
  const costsByRoom = rooms.map(room => {
    const roomTasks = tasks.filter(t => t.room_id === room.id);
    const roomPurchases = purchases.filter(p => p.room_id === room.id && p.status === 'purchased');
    const totalCost = roomTasks.reduce((sum, t) => sum + (parseFloat(t.actual_cost?.toString() || t.estimated_cost?.toString() || '0')), 0) +
                      roomPurchases.reduce((sum, p) => sum + parseFloat(p.total_price?.toString() || '0'), 0);
    
    const allocatedBudget = parseFloat(room.allocated_budget?.toString() || '0');
    
    return {
      room_name: room.name,
      total_cost: totalCost,
      allocated: allocatedBudget,
      usage_rate: allocatedBudget ? (totalCost / allocatedBudget) * 100 : 0,
    };
  });

  // Détection de risques
  const risks = [];
  if (budgetUsageRate > 100) {
    risks.push({
      type: 'budget_exceeded',
      severity: 'high',
      message: `Budget dépassé de ${(budgetUsageRate - 100).toFixed(1)}%`,
    });
  } else if (budgetUsageRate > 90) {
    risks.push({
      type: 'budget_warning',
      severity: 'medium',
      message: `Plus de 90% du budget utilisé`,
    });
  }

  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  if (blockedTasks.length > 0) {
    risks.push({
      type: 'blocked_tasks',
      severity: 'medium',
      message: `${blockedTasks.length} tâche(s) bloquée(s)`,
    });
  }

  return {
    completion_rate: completionRate,
    budget_usage_rate: budgetUsageRate,
    total_budget: parseFloat(projectData.total_budget?.toString() || '0'),
    total_spent: totalSpent,
    total_allocated: totalAllocated,
    tasks_total: tasks.length,
    tasks_completed: completedTasks,
    tasks_in_progress: tasks.filter(t => t.status === 'in_progress').length,
    tasks_blocked: blockedTasks.length,
    tasks_by_category: tasksByCategory,
    costs_by_room: costsByRoom,
    risks,
    estimated_remaining_cost: totalEstimated - totalActual,
  };
}

export async function detectBudgetRisks(projectId: string) {
  const analytics = await getProjectAnalytics(projectId);
  const risks = [];

  if (analytics.budget_usage_rate > 100) {
    const overspend = analytics.total_spent - analytics.total_budget;
    risks.push({
      risk_level: 'high',
      type: 'budget_exceeded',
      message: `Budget dépassé de ${overspend.toFixed(0)}€`,
      projected_overspend: overspend,
      recommendations: [
        'Réviser les coûts des tâches restantes',
        'Augmenter le budget total',
        'Annuler ou reporter les tâches non essentielles',
      ],
    });
  } else if (analytics.budget_usage_rate > 80) {
    const remaining = analytics.total_budget - analytics.total_spent;
    const estimatedRemaining = analytics.estimated_remaining_cost;
    
    if (estimatedRemaining > remaining) {
      risks.push({
        risk_level: 'medium',
        type: 'budget_risk',
        message: 'Le coût estimé des tâches restantes dépasse le budget disponible',
        projected_overspend: estimatedRemaining - remaining,
        recommendations: [
          'Revoir les estimations',
          'Prioriser les tâches essentielles',
          'Chercher des alternatives moins coûteuses',
        ],
      });
    }
  }

  // Vérifier les pièces qui dépassent leur budget
  analytics.costs_by_room.forEach(room => {
    if (room.usage_rate > 100) {
      risks.push({
        risk_level: 'medium',
        type: 'room_budget_exceeded',
        message: `Pièce "${room.room_name}" a dépassé son budget de ${(room.usage_rate - 100).toFixed(1)}%`,
        recommendations: [`Réallouer le budget pour la pièce ${room.room_name}`],
      });
    }
  });

  return {
    risk_level: risks.length > 0 ? (risks.some(r => r.risk_level === 'high') ? 'high' : 'medium') : 'low',
    risks,
    summary: risks.length === 0 
      ? 'Aucun risque budgétaire détecté'
      : `${risks.length} risque(s) budgétaire(s) détecté(s)`,
  };
}

export async function suggestTaskOrder(projectId: string) {
  const projectData = await getProjectById(projectId);
  if (!projectData) throw new Error('Projet non trouvé');

  const tasks = projectData.rooms.flatMap(room => 
    room.tasks.map(task => ({
      ...task,
      room_name: room.name,
    }))
  ).filter(t => t.status !== 'completed');

  // Ordre logique de rénovation
  const categoryOrder = [
    'demolition',
    'plomberie',
    'electricite',
    'isolation',
    'platrerie',
    'carrelage',
    'menuiserie',
    'peinture',
    'autre',
  ];

  // Trier par catégorie puis par priorité
  const sortedTasks = tasks.sort((a, b) => {
    const catIndexA = categoryOrder.indexOf(a.category);
    const catIndexB = categoryOrder.indexOf(b.category);
    
    if (catIndexA !== catIndexB) {
      return catIndexA - catIndexB;
    }
    
    const priorityOrder = ['urgent', 'high', 'medium', 'low'];
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  });

  return {
    suggested_order: sortedTasks.map((task, index) => ({
      order: index + 1,
      task_id: task.id,
      title: task.title,
      category: task.category,
      room_name: task.room_name,
      priority: task.priority,
      rationale: `${getCategoryRationale(task.category)}`,
    })),
    explanation: 'L\'ordre suggéré suit les bonnes pratiques de rénovation: démolition → plomberie/électricité → isolation → finitions',
  };
}

function getCategoryRationale(category: string): string {
  const rationales: Record<string, string> = {
    demolition: 'La démolition doit être faite en premier pour préparer l\'espace',
    plomberie: 'La plomberie doit être installée avant les finitions',
    electricite: 'L\'électricité doit être installée avant les finitions',
    isolation: 'L\'isolation doit être faite après les canalisations mais avant le cloisonnement',
    platrerie: 'Les cloisons et plafonds avant les revêtements',
    carrelage: 'Le carrelage avant la peinture pour faciliter le nettoyage',
    menuiserie: 'Les menuiseries après le gros œuvre',
    peinture: 'La peinture en dernier pour éviter les dégradations',
    autre: 'Autres travaux à planifier selon les besoins',
  };
  return rationales[category] || 'Planifier selon les dépendances';
}

export async function getProjectSummary(projectId: string) {
  const projectData = await getProjectById(projectId);
  if (!projectData) throw new Error('Projet non trouvé');

  const tasks = projectData.rooms.flatMap(room => room.tasks);
  const purchases = await getPurchasesByProjectId(projectId);

  const totalEstimated = tasks.reduce((sum, t) => sum + (parseFloat(t.estimated_cost?.toString() || '0')), 0);
  const totalActual = tasks.reduce((sum, t) => sum + (parseFloat(t.actual_cost?.toString() || '0')), 0);
  const totalPurchased = purchases.filter(p => p.status === 'purchased').reduce((sum, p) => sum + parseFloat(p.total_price?.toString() || '0'), 0);
  const totalSpent = totalActual + totalPurchased;

  return {
    project_name: projectData.name,
    total_budget: parseFloat(projectData.total_budget?.toString() || '0'),
    total_spent: totalSpent,
    budget_remaining: parseFloat(projectData.total_budget?.toString() || '0') - totalSpent,
    rooms_count: projectData.rooms.length,
    tasks_total: tasks.length,
    tasks_completed: tasks.filter(t => t.status === 'completed').length,
    tasks_in_progress: tasks.filter(t => t.status === 'in_progress').length,
    tasks_todo: tasks.filter(t => t.status === 'todo').length,
    tasks_blocked: tasks.filter(t => t.status === 'blocked').length,
    purchases_total: purchases.length,
    purchases_planned: purchases.filter(p => p.status === 'planned').length,
    purchases_purchased: purchases.filter(p => p.status === 'purchased').length,
    completion_rate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
  };
}

export async function suggestCostSavings(projectId: string) {
  const projectData = await getProjectById(projectId);
  if (!projectData) throw new Error('Projet non trouvé');

  const tasks = projectData.rooms.flatMap(room => 
    room.tasks.map(task => ({
      ...task,
      room_name: room.name,
    }))
  ).filter(t => t.status !== 'completed');

  const suggestions = [];

  // Identifier les tâches coûteuses
  const expensiveTasks = tasks
    .filter(t => parseFloat(t.estimated_cost?.toString() || '0') > 1000)
    .sort((a, b) => parseFloat(b.estimated_cost?.toString() || '0') - parseFloat(a.estimated_cost?.toString() || '0'));

  expensiveTasks.slice(0, 3).forEach(task => {
    suggestions.push({
      task_id: task.id,
      task_title: task.title,
      current_cost: parseFloat(task.estimated_cost?.toString() || '0'),
      potential_savings: parseFloat(task.estimated_cost?.toString() || '0') * 0.2, // 20% économies potentielles
      recommendations: [
        'Comparer les prix de plusieurs fournisseurs',
        'Envisager des matériaux alternatifs de qualité équivalente',
        'Vérifier si certains travaux peuvent être réalisés en DIY',
      ],
    });
  });

  return {
    total_potential_savings: suggestions.reduce((sum, s) => sum + s.potential_savings, 0),
    suggestions,
    general_recommendations: [
      'Acheter en gros pour les matériaux',
      'Profiter des promotions et soldes',
      'Négocier avec les artisans',
      'Grouper les achats pour réduire les frais de livraison',
    ],
  };
}