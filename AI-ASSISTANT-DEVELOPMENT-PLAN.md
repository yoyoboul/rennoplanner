# 🤖 Plan de Développement - Assistant IA Complet

**Date:** 3 octobre 2025  
**Objectif:** Créer un Assistant IA de niveau professionnel avec GPT-4o/GPT-5  
**Stack:** OpenAI API + Function Calling + Streaming + RAG

---

## 📊 État Actuel (Audit)

### ✅ Ce qui existe déjà

1. **Interface Chat** (`components/ai-chat.tsx`)
   - ✅ UI de base avec messages
   - ✅ Support Markdown
   - ✅ Loading states
   - ❌ Pas de streaming
   - ❌ Pas de suggestions intelligentes
   - ❌ Pas de contexte persistant

2. **API Chat** (`app/api/chat/route.ts`)
   - ✅ Intégration OpenAI
   - ✅ Function calling basique
   - ✅ Rate limiting
   - ✅ Error handling
   - ✅ Chat history (base de données)
   - ❌ Modèle: GPT-4-turbo (ancien)
   - ❌ Pas de streaming
   - ❌ Contexte limité

3. **AI Tools** (`lib/ai-tools.ts`)
   - ✅ 14 fonctions existantes :
     - `add_task`, `update_task`, `delete_task`, `list_tasks`
     - `add_room`, `get_room_info`
     - `calculate_project_cost`, `get_budget_summary`
     - `add_purchase`, `update_purchase`, `delete_purchase`, `list_purchases`, `get_shopping_summary`
     - `suggest_task_order`
   - ❌ Descriptions incomplètes
   - ❌ Manque validation avancée
   - ❌ Pas de fonctions pour documents, timeline, analytics

### ❌ Ce qui manque (Gaps)

1. **Fonctionnalités manquantes:**
   - Analyse de documents (OCR, extraction données)
   - Génération de rapports PDF
   - Analyse de photos (avant/après)
   - Suggestions proactives
   - Multi-projets (comparaison, insights)
   - Recherche sémantique dans l'historique
   - Export données (CSV, Excel)

2. **UX manquante:**
   - Streaming (réponses en temps réel)
   - Suggestions de questions rapides
   - Résumé de conversation
   - Aperçu avant exécution d'actions
   - Annulation d'actions
   - Mode vocal (Speech-to-Text)

3. **Intelligence manquante:**
   - Contexte projet automatique
   - Mémoire long terme
   - Apprentissage des préférences
   - Prédictions basées sur historique
   - Détection d'anomalies (budget, délais)

---

## 🎯 Objectifs du Nouveau Assistant

### 1. **Assistant Conversationnel Avancé**
- Comprendre le langage naturel (français + contexte métier)
- Gérer des conversations multi-tours complexes
- Mémoriser le contexte de la conversation
- Être proactif (alertes, suggestions)

### 2. **Intégration Complète avec l'Application**
- Accès à TOUTES les fonctionnalités
- Modification de toutes les entités (projets, pièces, tâches, achats, budget)
- Analyse et reporting
- Automatisation de workflows

### 3. **Expérience Utilisateur Premium**
- Streaming des réponses
- Suggestions intelligentes
- Confirmations avant actions destructives
- Historique persistant et recherchable
- Mode vocal (optionnel)

### 4. **Intelligence Avancée**
- Analyse prédictive (délais, coûts)
- Détection d'anomalies
- Suggestions basées sur données
- Apprentissage des habitudes utilisateur

---

## 📋 Plan d'Implémentation (5 Phases)

---

## **PHASE 1 : Fondations & Migration GPT-4o** ⚡

**Durée estimée:** 1-2h  
**Priorité:** CRITIQUE  
**Impact:** TRÈS ÉLEVÉ

### Objectifs
- ✅ Migrer de GPT-4-turbo vers GPT-4o (ou gpt-4o-2024-11-20)
- ✅ Implémenter le streaming des réponses
- ✅ Améliorer le context management
- ✅ Optimiser les prompts système

### Tâches détaillées

#### 1.1. Migration vers GPT-4o ⭐⭐⭐⭐⭐
**Fichier:** `app/api/chat/route.ts`

**Actions:**
```typescript
// Avant
model: 'gpt-4-turbo-preview'

// Après
model: 'gpt-4o-2024-11-20' // GPT-4o (ou 'o1-preview' pour GPT-5 alpha)
```

**Bénéfices:**
- 2x plus rapide
- 50% moins cher
- Meilleure compréhension du français
- Meilleure génération de code
- Support vision (images)

#### 1.2. Implémentation du Streaming ⭐⭐⭐⭐⭐
**Fichiers:**
- `app/api/chat/route.ts` (backend)
- `components/ai-chat.tsx` (frontend)

**Backend:**
```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-2024-11-20',
  messages: [...],
  tools: availableTools,
  stream: true, // ← STREAMING
});

// Retourner un ReadableStream
return new Response(stream.toReadableStream(), {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

**Frontend:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ messages, project_id }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Afficher le chunk en temps réel
  setMessages(prev => [...prev.slice(0, -1), {
    role: 'assistant',
    content: prev[prev.length - 1].content + chunk
  }]);
}
```

**Bénéfices:**
- Réponses visibles immédiatement (type ChatGPT)
- Meilleure UX (pas d'attente)
- Perception de rapidité

#### 1.3. Context Management Avancé ⭐⭐⭐⭐
**Fichier:** `lib/ai-context.ts` (nouveau)

**Créer un système de contexte intelligent:**
```typescript
export async function buildProjectContext(projectId: number) {
  const project = await getProject(projectId);
  const tasks = await getAllTasks(projectId);
  const purchases = await getAllPurchases(projectId);
  const budget = await getBudgetSummary(projectId);
  
  return `
CONTEXTE DU PROJET:
- Nom: ${project.name}
- Budget total: ${project.total_budget}€
- Budget utilisé: ${budget.spent}€ (${budget.percentage}%)
- Nombre de pièces: ${project.rooms.length}
- Nombre de tâches: ${tasks.length}
  - En cours: ${tasks.filter(t => t.status === 'in_progress').length}
  - Complétées: ${tasks.filter(t => t.status === 'completed').length}
  - Bloquées: ${tasks.filter(t => t.status === 'blocked').length}
- Achats: ${purchases.length} articles (${purchases.filter(p => p.status === 'purchased').length} achetés)

PIÈCES:
${project.rooms.map(r => `- ${r.name} (${r.tasks.length} tâches)`).join('\n')}
  `;
}
```

**Utilisation:**
```typescript
const contextMessage = {
  role: 'system',
  content: await buildProjectContext(project_id)
};
```

**Bénéfices:**
- L'IA connaît l'état exact du projet
- Réponses plus pertinentes
- Suggestions contextuelles

#### 1.4. Optimisation des Prompts ⭐⭐⭐
**Fichier:** `lib/ai-prompts.ts` (nouveau)

**Créer des prompts structurés:**
```typescript
export const SYSTEM_PROMPT = `Tu es RenovAI, un assistant expert en rénovation d'appartements.

## RÔLE
Tu accompagnes les utilisateurs dans la planification, le suivi et l'optimisation de leurs projets de rénovation.

## CAPACITÉS
1. **Gestion de Projet**
   - Créer et organiser des pièces
   - Ajouter, modifier, supprimer des tâches
   - Planifier l'ordre optimal des travaux
   
2. **Gestion Budgétaire**
   - Calculer les coûts estimés et réels
   - Suivre le budget en temps réel
   - Alerter en cas de dépassement
   - Suggérer des optimisations
   
3. **Liste de Courses**
   - Créer et gérer les achats
   - Estimer les prix (marché français)
   - Suivre ce qui est acheté
   
4. **Analyse & Conseils**
   - Analyser l'avancement du projet
   - Détecter les risques (délais, budget)
   - Suggérer des améliorations
   - Fournir des conseils techniques

## PERSONNALITÉ
- **Professionnel** mais sympathique
- **Précis** dans les estimations
- **Proactif** : anticipe les besoins
- **Pédagogue** : explique les concepts
- **Pragmatique** : solutions concrètes

## RÈGLES
1. Toujours demander confirmation avant suppression
2. Estimer des prix réalistes (marché français 2025)
3. Suggérer l'ordre optimal : démolition → gros œuvre → second œuvre → finitions
4. Alerter si budget > 90% utilisé
5. Proposer alternatives si coûts élevés

## FORMAT DE RÉPONSE
- Utilise Markdown pour la lisibilité
- Utilise des émojis pertinents (🏠 🔨 💰 ✅)
- Structure en listes quand possible
- Sois concis mais complet`;

export const USER_PREFERENCES_PROMPT = (preferences: any) => `
## PRÉFÉRENCES UTILISATEUR
- Budget serré: ${preferences.budgetConscious ? 'OUI' : 'NON'}
- Niveau d'expérience: ${preferences.experienceLevel}
- Priorités: ${preferences.priorities.join(', ')}
`;
```

**Bénéfices:**
- Réponses cohérentes
- Personnalité définie
- Comportement prévisible

---

## **PHASE 2 : Extension des Fonctionnalités** 🔧

**Durée estimée:** 2-3h  
**Priorité:** HAUTE  
**Impact:** ÉLEVÉ

### Objectifs
- ✅ Ajouter 20+ nouvelles fonctions AI
- ✅ Couvrir 100% des fonctionnalités de l'app
- ✅ Ajouter des fonctions d'analyse avancées

### Nouvelles Fonctions à Créer

#### 2.1. Gestion de Projet Avancée

```typescript
// lib/ai-tools-extended.ts

export const projectManagementTools = [
  {
    name: 'create_project',
    description: 'Crée un nouveau projet de rénovation',
    parameters: {
      name: 'string',
      description: 'string',
      total_budget: 'number',
      start_date: 'string (optional)',
    }
  },
  {
    name: 'update_project',
    description: 'Met à jour un projet (budget, dates, description)',
    // ...
  },
  {
    name: 'archive_project',
    description: 'Archive un projet terminé',
    // ...
  },
  {
    name: 'duplicate_project',
    description: 'Duplique un projet (utile pour projets similaires)',
    // ...
  },
];
```

#### 2.2. Analyse & Reporting

```typescript
export const analyticsTools = [
  {
    name: 'get_project_analytics',
    description: 'Obtient des analytics détaillées du projet',
    returns: {
      completion_rate: 'number',
      budget_usage_rate: 'number',
      estimated_completion_date: 'string',
      tasks_by_category: 'object',
      costs_by_room: 'object',
      timeline_deviation: 'number',
      risks: 'array',
    }
  },
  {
    name: 'compare_projects',
    description: 'Compare plusieurs projets (coûts, durées, etc.)',
    // ...
  },
  {
    name: 'predict_completion_date',
    description: 'Prédit la date de fin basée sur le rythme actuel',
    // ...
  },
  {
    name: 'detect_budget_risks',
    description: 'Détecte les risques de dépassement budgétaire',
    returns: {
      risk_level: 'low | medium | high',
      projected_overspend: 'number',
      recommendations: 'array',
    }
  },
];
```

#### 2.3. Timeline & Planification

```typescript
export const timelineTools = [
  {
    name: 'create_timeline',
    description: 'Génère un planning optimal basé sur les dépendances',
    // ...
  },
  {
    name: 'detect_task_dependencies',
    description: 'Détecte les dépendances entre tâches (ex: électricité avant peinture)',
    // ...
  },
  {
    name: 'optimize_schedule',
    description: 'Optimise le planning pour minimiser la durée',
    // ...
  },
  {
    name: 'check_schedule_conflicts',
    description: 'Vérifie les conflits de dates',
    // ...
  },
];
```

#### 2.4. Budget & Optimisation

```typescript
export const budgetTools = [
  {
    name: 'allocate_budget_smart',
    description: 'Répartit le budget de manière optimale selon priorités',
    // ...
  },
  {
    name: 'suggest_cost_savings',
    description: 'Suggère des économies sans compromis qualité',
    returns: {
      savings: 'array<{task, original_cost, optimized_cost, suggestion}>',
      total_potential_savings: 'number',
    }
  },
  {
    name: 'compare_supplier_prices',
    description: 'Compare les prix de différents fournisseurs',
    // ...
  },
  {
    name: 'get_market_price_estimate',
    description: 'Estime le prix marché pour un type de travaux',
    parameters: {
      task_type: 'string',
      area_size: 'number',
      location: 'string',
    }
  },
];
```

#### 2.5. Documents & Export

```typescript
export const documentTools = [
  {
    name: 'generate_project_report',
    description: 'Génère un rapport PDF complet du projet',
    parameters: {
      include_photos: 'boolean',
      include_timeline: 'boolean',
      include_budget_breakdown: 'boolean',
    }
  },
  {
    name: 'export_shopping_list',
    description: 'Exporte la liste de courses en PDF',
    // ...
  },
  {
    name: 'export_to_excel',
    description: 'Exporte les données en Excel',
    // ...
  },
  {
    name: 'analyze_invoice',
    description: 'Analyse une facture (OCR + extraction données)',
    parameters: {
      image_url: 'string',
    }
  },
];
```

#### 2.6. Recherche & Historique

```typescript
export const searchTools = [
  {
    name: 'search_tasks',
    description: 'Recherche sémantique dans les tâches',
    parameters: {
      query: 'string',
      filters: 'object (optional)',
    }
  },
  {
    name: 'search_chat_history',
    description: 'Recherche dans l\'historique de conversation',
    // ...
  },
  {
    name: 'summarize_conversation',
    description: 'Résume la conversation en cours',
    // ...
  },
];
```

---

## **PHASE 3 : UX Avancée & Interactivité** 🎨

**Durée estimée:** 2-3h  
**Priorité:** HAUTE  
**Impact:** TRÈS ÉLEVÉ

### Objectifs
- ✅ Streaming des réponses avec animation
- ✅ Suggestions de questions intelligentes
- ✅ Aperçu avant exécution d'actions
- ✅ Mode vocal (Speech-to-Text)

### 3.1. Suggestions Intelligentes ⭐⭐⭐⭐⭐

**Fichier:** `components/ai-chat-suggestions.tsx`

```typescript
export function ChatSuggestions({ project, onSelect }: Props) {
  const suggestions = useMemo(() => {
    const base = [];
    
    // Suggestions contextuelles basées sur l'état du projet
    if (project.tasks.filter(t => t.status === 'todo').length > 5) {
      base.push({
        icon: '📋',
        text: 'Quel est l\'ordre optimal des tâches ?',
        category: 'planning'
      });
    }
    
    if (project.budget_usage > 0.8) {
      base.push({
        icon: '💰',
        text: 'Comment optimiser mon budget ?',
        category: 'budget'
      });
    }
    
    if (project.purchases.filter(p => p.status === 'planned').length > 0) {
      base.push({
        icon: '🛒',
        text: 'Génère ma liste de courses',
        category: 'shopping'
      });
    }
    
    // Suggestions génériques
    base.push(
      { icon: '📊', text: 'Analyse l\'avancement du projet', category: 'analytics' },
      { icon: '🔨', text: 'Ajoute une tâche', category: 'action' },
      { icon: '📅', text: 'Quand le projet sera-t-il terminé ?', category: 'prediction' },
    );
    
    return base;
  }, [project]);
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion.text)}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <span>{suggestion.icon}</span>
          <span>{suggestion.text}</span>
        </button>
      ))}
    </div>
  );
}
```

### 3.2. Aperçu Avant Exécution ⭐⭐⭐⭐

**Fichier:** `components/ai-action-preview.tsx`

```typescript
export function ActionPreview({ action, onConfirm, onCancel }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">
            Action à confirmer
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            {action.description}
          </p>
          
          {/* Aperçu des changements */}
          <div className="bg-white rounded p-3 mb-3 text-sm">
            <div className="font-medium mb-2">Aperçu :</div>
            {action.type === 'create_task' && (
              <div>
                <div>✅ Nouvelle tâche : <strong>{action.params.title}</strong></div>
                <div>📍 Pièce : {action.params.room_name}</div>
                <div>💰 Coût estimé : {action.params.estimated_cost}€</div>
              </div>
            )}
            {action.type === 'delete_task' && (
              <div className="text-red-600">
                <div>⚠️ Suppression de la tâche : <strong>{action.params.task_title}</strong></div>
                <div className="text-xs mt-1">Cette action est irréversible</div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={onConfirm}>Confirmer</Button>
            <Button size="sm" variant="outline" onClick={onCancel}>Annuler</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

### 3.3. Mode Vocal (Speech-to-Text) ⭐⭐⭐

**Fichier:** `components/voice-input.tsx`

```typescript
export function VoiceInput({ onTranscript }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = async (event) => {
      const audioBlob = event.data;
      
      // Envoyer à OpenAI Whisper
      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('model', 'whisper-1');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: formData
      });
      
      const data = await response.json();
      setTranscript(data.text);
      onTranscript(data.text);
    };
    
    mediaRecorder.start();
    setIsRecording(true);
  };
  
  return (
    <Button
      variant={isRecording ? 'destructive' : 'outline'}
      size="sm"
      onClick={isRecording ? stopRecording : startRecording}
    >
      {isRecording ? <Square /> : <Mic />}
    </Button>
  );
}
```

### 3.4. Messages Typés ⭐⭐⭐⭐

**Effet typewriter pour streaming:**

```typescript
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(index + 1);
      }, 20); // 20ms par caractère
      
      return () => clearTimeout(timeout);
    }
  }, [index, text]);
  
  return <span>{displayedText}</span>;
}
```

---

## **PHASE 4 : Intelligence Avancée** 🧠

**Durée estimée:** 3-4h  
**Priorité:** MOYENNE  
**Impact:** ÉLEVÉ

### Objectifs
- ✅ Détection proactive d'anomalies
- ✅ Suggestions basées sur patterns
- ✅ Apprentissage des préférences
- ✅ RAG (Retrieval Augmented Generation)

### 4.1. Détection d'Anomalies ⭐⭐⭐⭐

**Fichier:** `lib/ai-anomaly-detection.ts`

```typescript
export async function detectAnomalies(projectId: number) {
  const project = await getProject(projectId);
  const anomalies = [];
  
  // Détection budget
  if (project.budget_usage > 1.0) {
    anomalies.push({
      type: 'budget_exceeded',
      severity: 'high',
      message: `Budget dépassé de ${((project.budget_usage - 1) * 100).toFixed(0)}%`,
      suggestion: 'Révisez les coûts ou augmentez le budget'
    });
  }
  
  // Détection tâches bloquées trop longtemps
  const blockedTasks = project.tasks.filter(t => t.status === 'blocked');
  blockedTasks.forEach(task => {
    const daysSinceBlocked = daysBetween(task.updated_at, new Date());
    if (daysSinceBlocked > 7) {
      anomalies.push({
        type: 'task_blocked_too_long',
        severity: 'medium',
        message: `Tâche "${task.title}" bloquée depuis ${daysSinceBlocked} jours`,
        suggestion: 'Débloquez cette tâche ou supprimez-la'
      });
    }
  });
  
  // Détection ordre suspect
  const hasPaintingBeforeElectricity = detectSuspiciousOrder(project.tasks);
  if (hasPaintingBeforeElectricity) {
    anomalies.push({
      type: 'suspicious_task_order',
      severity: 'medium',
      message: 'Peinture prévue avant électricité',
      suggestion: 'Réorganisez l\'ordre des tâches'
    });
  }
  
  return anomalies;
}
```

### 4.2. RAG - Connaissance Métier ⭐⭐⭐⭐⭐

**Fichier:** `lib/ai-rag.ts`

**Objectif:** Enrichir l'IA avec des connaissances spécifiques à la rénovation

```typescript
// Base de connaissances vectorielle
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

// Documents de connaissances
const knowledgeBase = [
  {
    category: 'ordre_travaux',
    content: `
      ORDRE OPTIMAL DES TRAVAUX DE RÉNOVATION:
      1. Démolition et évacuation
      2. Gros œuvre (murs porteurs, ouvertures)
      3. Électricité (saignées, passage câbles)
      4. Plomberie (tuyauterie, évacuations)
      5. Isolation (murs, plafonds)
      6. Plâtrerie (doublages, cloisons)
      7. Menuiseries (portes, fenêtres)
      8. Carrelage et sols
      9. Peinture
      10. Finitions (plinthes, luminaires)
    `
  },
  {
    category: 'prix_marche',
    content: `
      PRIX MOYENS MARCHÉ FRANÇAIS 2025:
      - Peinture: 25-40€/m²
      - Carrelage: 40-80€/m²
      - Parquet: 50-100€/m²
      - Électricité complète: 80-120€/m²
      - Plomberie complète: 100-150€/m²
      - Cuisine équipée: 5000-15000€
      - Salle de bain: 8000-20000€
    `
  },
  // ... plus de documents
];

// Créer le vector store
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromTexts(
  knowledgeBase.map(doc => doc.content),
  knowledgeBase.map(doc => ({ category: doc.category })),
  embeddings
);

// Fonction de recherche
export async function searchKnowledge(query: string, k = 3) {
  const results = await vectorStore.similaritySearch(query, k);
  return results.map(doc => doc.pageContent).join('\n\n');
}

// Utilisation dans le chat
const relevantKnowledge = await searchKnowledge(userMessage);
const enhancedPrompt = `
${SYSTEM_PROMPT}

CONNAISSANCES PERTINENTES:
${relevantKnowledge}

QUESTION UTILISATEUR:
${userMessage}
`;
```

### 4.3. Apprentissage des Préférences ⭐⭐⭐

**Fichier:** `lib/ai-user-preferences.ts`

```typescript
export async function learnUserPreferences(userId: number) {
  const history = await getChatHistory(userId);
  
  // Analyser les patterns
  const preferences = {
    budgetConscious: history.filter(m => m.content.includes('économ')).length > 5,
    prefers_detailed_responses: averageResponseLength(history) > 200,
    categories_of_interest: extractFrequentCategories(history),
    preferred_suppliers: extractFrequentSuppliers(history),
  };
  
  // Sauvegarder
  await saveUserPreferences(userId, preferences);
  
  return preferences;
}
```

---

## **PHASE 5 : Fonctionnalités Premium** ⭐

**Durée estimée:** 4-5h  
**Priorité:** BASSE  
**Impact:** MOYEN

### Objectifs
- ✅ Analyse de photos (avant/après)
- ✅ Génération d'images (visualisations)
- ✅ Recherche sémantique multi-projets
- ✅ Export avancé (PDF, Excel)

### 5.1. Analyse de Photos avec Vision

```typescript
// Utilisation de GPT-4o Vision
const response = await openai.chat.completions.create({
  model: 'gpt-4o-2024-11-20',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyse cette photo de chantier et détecte les problèmes potentiels' },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }
  ]
});
```

### 5.2. Génération de Rapports PDF

```typescript
import { jsPDF } from 'jspdf';

export async function generateProjectReport(projectId: number) {
  const project = await getProject(projectId);
  const analytics = await getProjectAnalytics(projectId);
  
  const pdf = new jsPDF();
  
  // Page de garde
  pdf.setFontSize(24);
  pdf.text(project.name, 20, 30);
  
  // Résumé
  pdf.setFontSize(12);
  pdf.text(`Budget: ${formatCurrency(project.total_budget)}`, 20, 50);
  pdf.text(`Avancement: ${analytics.completion_rate}%`, 20, 60);
  
  // Graphiques
  // ...
  
  return pdf.output('blob');
}
```

---

## 📊 Récapitulatif des Phases

| Phase | Durée | Priorité | Impact | Statut |
|-------|-------|----------|--------|--------|
| **Phase 1: Fondations** | 1-2h | ⭐⭐⭐⭐⭐ | TRÈS ÉLEVÉ | 🔴 À faire |
| **Phase 2: Extension Fonctions** | 2-3h | ⭐⭐⭐⭐ | ÉLEVÉ | 🔴 À faire |
| **Phase 3: UX Avancée** | 2-3h | ⭐⭐⭐⭐ | TRÈS ÉLEVÉ | 🔴 À faire |
| **Phase 4: Intelligence** | 3-4h | ⭐⭐⭐ | ÉLEVÉ | 🟡 Optionnel |
| **Phase 5: Premium** | 4-5h | ⭐⭐ | MOYEN | 🟡 Optionnel |

**Temps total minimum (Phases 1-3):** 5-8h  
**Temps total complet (Toutes phases):** 12-17h

---

## 🎯 Ordre d'Implémentation Recommandé

### **Option 1 : MVP Rapide** (1-2h)
✅ Phase 1 uniquement
- Migration GPT-4o
- Streaming
- Context management

**Résultat:** Assistant fonctionnel et rapide

---

### **Option 2 : Complet Pro** (5-8h)
✅ Phases 1 + 2 + 3
- Fondations solides
- Toutes les fonctionnalités
- UX premium

**Résultat:** Assistant de niveau professionnel

---

### **Option 3 : Ultimate** (12-17h)
✅ Toutes les phases
- Intelligence avancée
- RAG
- Vision
- Export PDF

**Résultat:** Assistant IA de pointe

---

## 🚀 Quick Start - Prochaines Actions

**Je recommande de commencer par la Phase 1** pour avoir rapidement un assistant puissant :

1. ✅ Migrer vers GPT-4o
2. ✅ Implémenter le streaming
3. ✅ Améliorer le context management
4. ✅ Optimiser les prompts

**Souhaitez-vous que je commence l'implémentation de la Phase 1 maintenant ?**

Ou préférez-vous une autre approche ?

---

*Généré le 3 octobre 2025*  
*Plan complet pour un Assistant IA de niveau professionnel*

