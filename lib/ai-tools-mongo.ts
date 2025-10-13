import {
  createTask,
  updateTask as updateTaskDb,
  deleteTask as deleteTaskDb,
  getTasksByRoomId,
  createRoom,
  updateProject as updateProjectDb,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchasesByProjectId,
  getPurchaseById,
  getRoomById,
} from './db-mongo';
import { 
  getProjectAnalytics, 
  detectBudgetRisks, 
  suggestTaskOrder, 
  getProjectSummary,
  suggestCostSavings 
} from './ai-tools-extended';

// Note: Les types d'outils restent inchangés (avec number pour IDs)
// car c'est ce que l'IA envoie. On convertit en ObjectId dans les fonctions.

export const availableTools = [
  {
    type: 'function' as const,
    function: {
      name: 'add_task',
      description: 'Ajoute une nouvelle tâche de rénovation à une pièce spécifique',
      parameters: {
        type: 'object',
        properties: {
          room_id: {
            type: 'string',
            description: 'ID de la pièce où ajouter la tâche',
          },
          title: {
            type: 'string',
            description: 'Titre de la tâche',
          },
          description: {
            type: 'string',
            description: 'Description détaillée de la tâche',
          },
          category: {
            type: 'string',
            enum: ['plomberie', 'electricite', 'peinture', 'menuiserie', 'carrelage', 'platrerie', 'isolation', 'demolition', 'autre'],
            description: 'Catégorie de travaux',
          },
          estimated_cost: {
            type: 'number',
            description: 'Coût estimé en euros',
          },
          estimated_duration: {
            type: 'number',
            description: 'Durée estimée en jours (accepte les demi-journées: 0.5, 1, 1.5, 2, etc.)',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Priorité de la tâche',
          },
          start_date: {
            type: 'string',
            description: 'Date de début prévue (format YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'Date de fin prévue (format YYYY-MM-DD)',
          },
        },
        required: ['room_id', 'title', 'category'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_task',
      description: 'Met à jour une tâche existante (statut, coûts, dates, planification, etc.)',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'ID de la tâche à mettre à jour',
          },
          status: {
            type: 'string',
            enum: ['todo', 'in_progress', 'completed', 'blocked'],
            description: 'Nouveau statut de la tâche',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Nouvelle priorité de la tâche',
          },
          estimated_cost: {
            type: 'number',
            description: 'Coût estimé en euros',
          },
          actual_cost: {
            type: 'number',
            description: 'Coût réel en euros',
          },
          estimated_duration: {
            type: 'number',
            description: 'Durée estimée en jours (accepte les demi-journées: 0.5, 1, 1.5, 2, etc.)',
          },
          start_date: {
            type: 'string',
            description: 'Date de début prévue (format YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'Date de fin prévue (format YYYY-MM-DD)',
          },
          notes: {
            type: 'string',
            description: 'Notes additionnelles',
          },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_task',
      description: 'Supprime une tâche',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'ID de la tâche à supprimer',
          },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_tasks',
      description: 'Liste toutes les tâches d\'un projet ou d\'une pièce',
      parameters: {
        type: 'object',
        properties: {
          room_id: {
            type: 'string',
            description: 'ID de la pièce (optionnel)',
          },
          status: {
            type: 'string',
            enum: ['todo', 'in_progress', 'completed', 'blocked'],
            description: 'Filtrer par statut (optionnel)',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_room',
      description: 'Ajoute une nouvelle pièce au projet',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
          name: {
            type: 'string',
            description: 'Nom de la pièce (Cuisine, Salon, etc.)',
          },
          description: {
            type: 'string',
            description: 'Description de la pièce',
          },
          surface_area: {
            type: 'number',
            description: 'Surface en m²',
          },
          allocated_budget: {
            type: 'number',
            description: 'Budget alloué pour cette pièce en euros',
          },
        },
        required: ['project_id', 'name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_project',
      description: 'Met à jour les informations du projet (nom, description, budget total)',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet à mettre à jour',
          },
          name: {
            type: 'string',
            description: 'Nouveau nom du projet (optionnel)',
          },
          description: {
            type: 'string',
            description: 'Nouvelle description du projet (optionnel)',
          },
          total_budget: {
            type: 'number',
            description: 'Nouveau budget total en euros (optionnel)',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_purchase',
      description: 'Ajoute un article à la liste de courses ou enregistre un achat',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
          item_name: {
            type: 'string',
            description: 'Nom de l\'article à acheter',
          },
          description: {
            type: 'string',
            description: 'Description détaillée de l\'article',
          },
          quantity: {
            type: 'number',
            description: 'Quantité à acheter',
          },
          unit_price: {
            type: 'number',
            description: 'Prix unitaire en euros',
          },
          category: {
            type: 'string',
            description: 'Catégorie de l\'article (peinture, plomberie, etc.)',
          },
          item_type: {
            type: 'string',
            enum: ['materiaux', 'meubles'],
            description: 'Type d\'article: matériaux (peinture, carrelage...) ou meubles (table, chaise...)',
          },
          supplier: {
            type: 'string',
            description: 'Nom du fournisseur',
          },
          room_id: {
            type: 'string',
            description: 'ID de la pièce concernée (optionnel)',
          },
          status: {
            type: 'string',
            enum: ['planned', 'in_cart', 'purchased'],
            description: 'Statut de l\'achat (planned par défaut)',
          },
        },
        required: ['project_id', 'item_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_purchase',
      description: 'Met à jour un achat existant. Peut changer le statut (planned → in_cart → purchased), le prix réel payé, la quantité, etc.',
      parameters: {
        type: 'object',
        properties: {
          purchase_id: {
            type: 'string',
            description: 'ID de l\'achat à mettre à jour',
          },
          status: {
            type: 'string',
            enum: ['planned', 'in_cart', 'purchased'],
            description: 'Nouveau statut',
          },
          quantity: {
            type: 'number',
            description: 'Nouvelle quantité',
          },
          unit_price: {
            type: 'number',
            description: 'Prix réel payé par unité',
          },
          notes: {
            type: 'string',
            description: 'Notes additionnelles',
          },
        },
        required: ['purchase_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_purchase',
      description: 'Supprime un achat de la liste',
      parameters: {
        type: 'object',
        properties: {
          purchase_id: {
            type: 'string',
            description: 'ID de l\'achat à supprimer',
          },
        },
        required: ['purchase_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_purchases',
      description: 'Liste tous les achats d\'un projet',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
          status: {
            type: 'string',
            enum: ['planned', 'in_cart', 'purchased'],
            description: 'Filtrer par statut (optionnel)',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_shopping_summary',
      description: 'Obtient un résumé des achats avec totaux',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_project_summary',
      description: 'Obtient un résumé complet du projet avec statistiques',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_project_analytics',
      description: 'Obtient des analytics détaillées du projet',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'detect_budget_risks',
      description: 'Détecte les risques de dépassement budgétaire',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'suggest_cost_savings',
      description: 'Suggère des opportunités d\'économies',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'suggest_task_order',
      description: 'Suggère l\'ordre optimal pour réaliser les tâches',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_project_report',
      description: 'Génère un rapport PDF du projet (rapport complet ou liste de courses)',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID du projet',
          },
          format: {
            type: 'string',
            enum: ['report', 'shopping-list'],
            description: 'Format du rapport: "report" pour rapport complet, "shopping-list" pour liste de courses',
          },
        },
        required: ['project_id', 'format'],
      },
    },
  },
];

// Tool execution functions
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'add_task':
      return addTask(args);
    case 'update_task':
      return updateTaskFunc(args);
    case 'delete_task':
      return deleteTaskFunc(args);
    case 'list_tasks':
      return listTasks(args);
    case 'add_room':
      return addRoomFunc(args);
    case 'update_project':
      return updateProjectFunc(args);
    case 'add_purchase':
      return addPurchaseFunc(args);
    case 'update_purchase':
      return updatePurchaseFunc(args);
    case 'delete_purchase':
      return deletePurchaseFunc(args);
    case 'list_purchases':
      return listPurchases(args);
    case 'get_shopping_summary':
      return getShoppingSummaryFunc(args);
    case 'get_project_summary':
      return getProjectSummary(args.project_id as string);
    case 'get_project_analytics':
      return getProjectAnalytics(args.project_id as string);
    case 'detect_budget_risks':
      return detectBudgetRisks(args.project_id as string);
    case 'suggest_cost_savings':
      return suggestCostSavings(args.project_id as string);
    case 'suggest_task_order':
      return suggestTaskOrder(args.project_id as string);
    case 'generate_project_report':
      return generateProjectReportFunc(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function addTask(args: Record<string, unknown>) {
  const task = await createTask({
    room_id: args.room_id as string,
    title: args.title as string,
    description: args.description as string | undefined,
    category: args.category as
      | 'plomberie'
      | 'electricite'
      | 'peinture'
      | 'menuiserie'
      | 'carrelage'
      | 'platrerie'
      | 'isolation'
      | 'demolition'
      | 'autre',
    estimated_cost: (args.estimated_cost as number) || 0,
    estimated_duration: args.estimated_duration as number | undefined,
    priority: (args.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
    start_date: args.start_date as string | undefined,
    end_date: args.end_date as string | undefined,
    status: 'todo',
  });

  return { success: true, task };
}

async function updateTaskFunc(args: Record<string, unknown>) {
  const { task_id, ...updates } = args;
  const task = await updateTaskDb(task_id as string, updates);
  return { success: true, task };
}

async function deleteTaskFunc(args: Record<string, unknown>) {
  await deleteTaskDb(args.task_id as string);
  return { success: true, message: `Tâche ${args.task_id} supprimée` };
}

async function listTasks(args: Record<string, unknown>) {
  const { room_id, status } = args;

  if (!room_id) {
    return { success: false, error: 'room_id requis' };
  }

  let tasks = await getTasksByRoomId(room_id as string);

  // Ajouter le nom de la pièce
  const room = await getRoomById(room_id as string);
  tasks = tasks.map(task => ({
    ...task,
    room_name: room?.name || 'Unknown',
  }));

  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  return { success: true, tasks };
}

async function addRoomFunc(args: Record<string, unknown>) {
  const room = await createRoom({
    project_id: args.project_id as string,
    name: args.name as string,
    description: args.description as string | undefined,
    surface_area: args.surface_area as number | undefined,
    allocated_budget: args.allocated_budget as number | undefined,
  });

  return { success: true, room };
}

async function updateProjectFunc(args: Record<string, unknown>) {
  const { project_id, ...updates } = args;
  const project = await updateProjectDb(project_id as string, updates);
  return { success: true, project };
}

async function addPurchaseFunc(args: Record<string, unknown>) {
  const purchase = await createPurchase({
    project_id: args.project_id as string,
    room_id: args.room_id as string | undefined,
    task_id: args.task_id as string | undefined,
    item_name: args.item_name as string,
    description: args.description as string | undefined,
    quantity: (args.quantity as number) || 1,
    unit_price: (args.unit_price as number) || 0,
    total_price: ((args.quantity as number) || 1) * ((args.unit_price as number) || 0),
    category: args.category as string | undefined,
    item_type: (args.item_type as 'materiaux' | 'meubles') || 'materiaux',
    supplier: args.supplier as string | undefined,
    status: (args.status as 'planned' | 'in_cart' | 'purchased') || 'planned',
  });

  return { success: true, purchase };
}

async function updatePurchaseFunc(args: Record<string, unknown>) {
  const { purchase_id, ...updates } = args;
  
  // Recalculate total_price if needed
  const existing = await getPurchaseById(purchase_id as string);
  if (existing) {
    const quantity = (updates.quantity as number) ?? parseFloat(existing.quantity?.toString() || '1');
    const unit_price = (updates.unit_price as number) ?? parseFloat(existing.unit_price?.toString() || '0');
    (updates as Record<string, unknown>).total_price = quantity * unit_price;
  }

  const purchase = await updatePurchase(purchase_id as string, updates);
  return { success: true, purchase };
}

async function deletePurchaseFunc(args: Record<string, unknown>) {
  await deletePurchase(args.purchase_id as string);
  return { success: true, message: `Achat ${args.purchase_id} supprimé` };
}

async function listPurchases(args: Record<string, unknown>) {
  const { project_id, status } = args;
  let purchases = await getPurchasesByProjectId(project_id as string);

  if (status) {
    purchases = purchases.filter(p => p.status === status);
  }

  return { success: true, purchases };
}

async function generateProjectReportFunc(args: Record<string, unknown>) {
  const projectId = args.project_id as string;
  const format = args.format as string;
  
  // Build URL for the report
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/projects/${projectId}/export?type=${format}`;
  
  return {
    success: true,
    message: `📄 Rapport ${format === 'report' ? 'complet' : 'liste de courses'} généré avec succès ! Téléchargez-le via le menu "Actions" > "Exporter".`,
    download_url: url,
    format: format,
  };
}

async function getShoppingSummaryFunc(args: Record<string, unknown>) {
  const purchases = await getPurchasesByProjectId(args.project_id as string);

  const summary = {
    total_planned: 0,
    total_in_cart: 0,
    total_purchased: 0,
    count_planned: 0,
    count_in_cart: 0,
    count_purchased: 0,
    by_category: {} as Record<string, number>,
  };

  purchases.forEach(p => {
    const price = parseFloat(p.total_price?.toString() || '0');
    
    if (p.status === 'planned') {
      summary.total_planned += price;
      summary.count_planned++;
    } else if (p.status === 'in_cart') {
      summary.total_in_cart += price;
      summary.count_in_cart++;
    } else if (p.status === 'purchased') {
      summary.total_purchased += price;
      summary.count_purchased++;
    }

    if (p.category) {
      summary.by_category[p.category] = (summary.by_category[p.category] || 0) + price;
    }
  });

  return { success: true, summary };
}

