# 🏠 Planificateur de Rénovation avec IA

Une application moderne de gestion de projets de rénovation d'appartements, propulsée par l'intelligence artificielle (OpenAI GPT-5).

## ✨ Fonctionnalités

### 🤖 Assistant IA Intelligent
- Agent conversationnel capable de gérer vos tâches via langage naturel
- Ajout, modification et suppression de tâches par simple conversation
- Suggestions automatiques de l'ordre optimal des travaux
- Calculs de coûts et estimations
- Conseils d'expert en rénovation

### 📊 Gestion de Projet
- **Projets multiples** : Gérez plusieurs projets de rénovation
- **Organisation par pièces** : Cuisine, salle de bain, salon, etc.
- **Catégorisation des travaux** : Plomberie, électricité, peinture, menuiserie, etc.
- **Suivi des coûts** : Budget, coûts estimés vs réels
- **Priorisation** : Low, Medium, High, Urgent
- **Statuts de tâches** : À faire, En cours, Terminé, Bloqué
- **Liste de courses & Achats** : Gérez vos achats avec statuts (planifié, panier, acheté)
- **Intégration budget-achats** : Suivi en temps réel des dépenses réelles

### 🎨 Interface Moderne
- Design épuré et professionnel avec Tailwind CSS
- Vue d'ensemble avec statistiques et graphiques
- Vue Kanban avec drag & drop
- Vue Timeline pour planification
- **Vue Liste de Courses** : Gérez vos achats par statut
- Dashboard interactif
- Responsive et intuitive

## 🚀 Installation

### Prérequis
- Node.js 18+ et npm
- Une clé API OpenAI

### Étapes d'installation

1. **Les dépendances sont déjà installées**, mais si besoin :
```bash
npm install
```

2. **Configurer l'API OpenAI**

Ouvrez le fichier `.env.local` et ajoutez votre clé API OpenAI :
```bash
OPENAI_API_KEY=sk-votre-cle-api-openai-ici
```

Pour obtenir une clé API :
- Allez sur [platform.openai.com](https://platform.openai.com)
- Créez un compte ou connectez-vous
- Allez dans "API Keys" et créez une nouvelle clé

3. **Lancer l'application en développement**
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📖 Guide d'utilisation

### Créer un projet
1. Sur la page d'accueil, cliquez sur "Nouveau Projet"
2. Remplissez le nom, la description et le budget
3. Cliquez sur "Créer le projet"

### Ajouter des pièces
1. Dans la page du projet, cliquez sur "Ajouter une pièce"
2. Indiquez le nom (ex: Cuisine), la description et la surface
3. Validez

### Ajouter des tâches
Deux méthodes possibles :

**Méthode 1 : Manuellement**
1. Cliquez sur "Ajouter une tâche"
2. Remplissez le formulaire (pièce, titre, catégorie, coût, etc.)
3. **Important** : Ajoutez des dates de début et de fin pour visualiser la tâche dans la Timeline
4. Validez

**Méthode 2 : Via l'Assistant IA** ⭐
1. Cliquez sur l'onglet "Assistant IA"
2. Utilisez le langage naturel :
   - "Ajoute une tâche de peinture dans la cuisine pour 800€"
   - "Crée une tâche de remplacement de la plomberie dans la salle de bain"
   - "Quelle est l'ordre optimal des travaux ?"
   - "Calcule le coût total du projet"

### Utiliser le Kanban
1. Cliquez sur l'onglet "Kanban"
2. Glissez-déposez les tâches entre les colonnes (À faire, En cours, Terminé, Bloqué)
3. Les changements sont sauvegardés automatiquement

### Visualiser la Timeline
1. Cliquez sur l'onglet "Timeline"
2. Seules les tâches avec des dates de début et de fin apparaissent
3. Visualisez la chronologie et la durée de chaque tâche
4. Identifiez les chevauchements et planifiez efficacement

### Gérer le Budget 💰
1. Cliquez sur "Gérer le Budget" dans la page du projet
2. Définissez le budget total du projet
3. **Allocation automatique** : Cliquez sur "Répartir Auto" pour une répartition intelligente
   - Proportionnelle aux coûts estimés si disponibles
   - Équitable entre toutes les pièces sinon
4. **Allocation manuelle** : Ajustez le budget pour chaque pièce individuellement
5. Visualisez en temps réel :
   - Budget alloué vs budget total
   - **Dépenses réelles (achats effectués)**
   - Pourcentage par pièce
   - Marge disponible par pièce (budget alloué - dépenses totales)
   - Alertes si dépassement de budget

### Gérer la Liste de Courses 🛒
1. Cliquez sur l'onglet "Liste de Courses"
2. **Ajouter un article** :
   - Nom, quantité, prix unitaire
   - Catégorie et fournisseur (optionnel)
   - Lier à une pièce ou tâche
3. **Organiser vos achats** :
   - **À Planifier** : Articles à acheter prochainement
   - **Dans le Panier** : Articles prêts à être achetés
   - **Acheté** : Achats effectués avec date d'achat
4. **Suivi budgétaire** :
   - Visualisez le total par statut
   - Les achats effectués sont comptabilisés dans le budget
   - Comparaison avec le budget alloué par pièce

### Utiliser l'IA pour les Achats 🤖
L'assistant IA peut maintenant gérer vos achats :
```
"Ajoute 10L de peinture blanche à 25€ pour la cuisine"
"Marque l'achat de peinture comme effectué"
"Combien ai-je dépensé en achats ?"
"Liste les achats de la salle de bain"
"Quel est le total de ma liste de courses ?"
```

## 🛠️ Technologies utilisées

- **Frontend** : Next.js 15, React 19, TypeScript
- **Styling** : Tailwind CSS 4
- **State Management** : Zustand
- **Base de données** : SQLite (better-sqlite3)
- **IA** : OpenAI GPT-4/5 avec Function Calling
- **UI Components** : Custom components avec Radix UI principles
- **Animations** : Framer Motion
- **Icons** : Lucide React
- **Charts** : Recharts

## 📁 Structure du projet

```
reno-planner/
├── app/
│   ├── api/              # API Routes
│   │   ├── projects/     # Gestion des projets
│   │   ├── rooms/        # Gestion des pièces
│   │   ├── tasks/        # Gestion des tâches
│   │   └── chat/         # Chat avec l'IA
│   ├── project/[id]/     # Page détaillée d'un projet
│   └── page.tsx          # Page d'accueil
├── components/           # Composants React
│   ├── ui/              # Composants UI de base
│   ├── kanban-board.tsx # Vue Kanban
│   ├── project-stats.tsx # Statistiques du projet
│   └── ai-chat.tsx      # Interface de chat IA
├── lib/
│   ├── db.ts            # Configuration SQLite
│   ├── types.ts         # Types TypeScript
│   ├── store.ts         # Store Zustand
│   ├── ai-tools.ts      # Tools/Functions pour l'IA
│   └── utils.ts         # Fonctions utilitaires
└── reno-planner.db      # Base de données (créée au lancement)
```

## 🎯 Fonctionnalités de l'Agent IA

L'assistant IA dispose des capacités suivantes :

**Gestion des Tâches :**
1. **add_task** : Ajouter une nouvelle tâche
2. **update_task** : Modifier une tâche existante
3. **delete_task** : Supprimer une tâche
4. **list_tasks** : Lister les tâches par pièce ou statut

**Gestion du Projet :**
5. **add_room** : Ajouter une nouvelle pièce
6. **calculate_project_cost** : Calculer les coûts estimés/réels
7. **suggest_task_order** : Suggérer l'ordre optimal des travaux
8. **get_project_summary** : Obtenir un résumé complet du projet

**Gestion des Achats (Nouveau !) 🛒 :**
9. **add_purchase** : Ajouter un article à la liste de courses
10. **update_purchase** : Modifier un achat (statut, prix, quantité)
11. **delete_purchase** : Supprimer un achat
12. **list_purchases** : Lister les achats avec filtres
13. **get_shopping_summary** : Résumé des achats par statut et catégorie

## 📝 Exemples de commandes pour l'IA

**Gestion des tâches :**
```
"Ajoute une tâche de peinture dans le salon, coût estimé 1200€"
"Crée une pièce appelée 'Chambre parentale' de 18m²"
"Suggère-moi l'ordre optimal pour les travaux de la cuisine"
"Quel est le coût total estimé du projet ?"
"Marque la tâche de plomberie comme terminée et met le coût réel à 850€"
"Liste toutes les tâches en cours"
```

**Gestion des achats (Nouveau !) 🛒 :**
```
"Ajoute 10 litres de peinture blanche à 25€ pour la cuisine"
"Ajoute un robinet de cuisine à 120€ chez Leroy Merlin"
"Marque la peinture comme achetée"
"Combien ai-je dépensé en achats ?"
"Liste tous les achats déjà effectués"
"Quel est le total de ma liste de courses ?"
"Ajoute des carreaux de carrelage, 5m² à 30€/m² pour la salle de bain"
```

## 🔒 Sécurité

- La clé API OpenAI est stockée dans `.env.local` (non versionné)
- La base de données SQLite est locale
- Pas de données sensibles transmises

## 🚧 Développement futur

Fonctionnalités potentielles à ajouter :
- [x] ✅ Liste de courses et gestion des achats
- [x] ✅ Intégration budget-achats en temps réel
- [x] ✅ Outils IA pour gérer les achats
- [ ] Upload de photos et documents
- [ ] Export PDF du planning
- [ ] Notifications et rappels
- [ ] Mode collaboratif multi-utilisateurs
- [ ] Intégration calendrier
- [ ] Gestion des artisans/fournisseurs
- [ ] Scanner de reçus pour import automatique des achats

## 📄 License

MIT

## 👨‍💻 Développé avec

Next.js + TypeScript + OpenAI + ❤️
