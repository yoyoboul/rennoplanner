# 🚀 Guide : Migration MongoDB Atlas + Vercel

## ⚠️ Important

Cette migration est **complexe** et nécessite de réécrire une grande partie du code. Voici un guide détaillé.

---

## 📋 Étape 1 : Configuration MongoDB Atlas (Gratuit)

### 1.1 Créer un Compte

1. Allez sur https://www.mongodb.com/cloud/atlas/register
2. Créez un compte gratuit
3. Vérifiez votre email

### 1.2 Créer un Cluster (FREE Tier)

1. Cliquez sur **"Build a Database"**
2. Choisissez **M0 FREE** (0€/mois)
3. Provider : **AWS** ou **Google Cloud**
4. Région : **Europe (Frankfurt, Paris, ou London)**
5. Nom du cluster : `reno-planner-cluster`
6. Cliquez sur **"Create"**

### 1.3 Configurer l'Accès

#### Créer un utilisateur :
1. Dans "Security" → "Database Access"
2. Cliquez sur **"Add New Database User"**
3. Username : `renoplanner`
4. Password : **Générez un mot de passe fort** (notez-le !)
5. Built-in Role : **Read and write to any database**
6. Cliquez sur **"Add User"**

#### Autoriser les connexions :
1. Dans "Security" → "Network Access"
2. Cliquez sur **"Add IP Address"**
3. Choisissez **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Cliquez sur **"Confirm"**

### 1.4 Récupérer la Connection String

1. Dans "Deployment" → "Database"
2. Cliquez sur **"Connect"** sur votre cluster
3. Choisissez **"Connect your application"**
4. Driver : **Node.js**
5. Version : **Latest**
6. Copiez la connection string :
   ```
   mongodb+srv://renoplanner:<password>@reno-planner-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Remplacez `<password>` par votre mot de passe
8. Ajoutez le nom de la base : `/reno-planner` avant le `?`
   ```
   mongodb+srv://renoplanner:VOTRE_PASSWORD@cluster.xxxxx.mongodb.net/reno-planner?retryWrites=true&w=majority
   ```

---

## 📦 Étape 2 : Configuration Locale

### 2.1 Créer le fichier .env.local

Dans `/Users/yoan/reno-planner/.env.local` :

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-votre-cle-api

# MongoDB Connection String
MONGODB_URI=mongodb+srv://renoplanner:VOTRE_PASSWORD@cluster.xxxxx.mongodb.net/reno-planner?retryWrites=true&w=majority

# Environment
NODE_ENV=development
```

⚠️ **Remplacez** :
- `sk-votre-cle-api` par votre vraie clé OpenAI
- `VOTRE_PASSWORD` par le mot de passe MongoDB
- `cluster.xxxxx.mongodb.net` par votre vraie URL

### 2.2 Vérifier les dépendances

```bash
npm install mongodb
```

✅ Déjà fait !

---

## 🔧 Étape 3 : Migration du Code

### ⚠️ Problème Majeur

Votre code actuel utilise **SQLite avec better-sqlite3**. La migration vers MongoDB nécessite de :

1. ✅ Réécrire **toutes les API routes** (8 fichiers)
2. ✅ Réécrire **le store Zustand** (`lib/store.ts`)
3. ✅ Adapter **les types TypeScript** (`lib/types.ts`)
4. ✅ Migrer **les données existantes** (optionnel)

### Estimation : **4-6 heures de travail**

---

## 🎯 Options Disponibles

### Option A : Migration Manuelle (Vous le faites)

**Avantages** :
- ✅ Vous apprenez MongoDB
- ✅ Vous contrôlez tout
- ✅ Flexibilité totale

**Inconvénients** :
- ❌ Long (4-6h)
- ❌ Risque d'erreurs
- ❌ Complexe

### Option B : Migration Assistée (Je vous guide fichier par fichier)

**Avantages** :
- ✅ Guidé étape par étape
- ✅ Moins d'erreurs
- ✅ Vous apprenez quand même

**Inconvénients** :
- ❌ Prend du temps (plusieurs échanges)
- ❌ Demande de la concentration

### Option C : Alternative Plus Simple

**Utiliser PlanetScale (MySQL gratuit) ou Supabase (PostgreSQL gratuit)**

Ces solutions supportent mieux le code existant (SQL) et nécessitent moins de changements.

---

## 📝 Fichiers à Migrer

Si vous choisissez de migrer vers MongoDB, voici les fichiers à modifier :

### 1. API Routes (Priority High)

- [ ] `app/api/projects/route.ts`
- [ ] `app/api/projects/[id]/route.ts`
- [ ] `app/api/rooms/route.ts`
- [ ] `app/api/rooms/[id]/route.ts`
- [ ] `app/api/tasks/route.ts`
- [ ] `app/api/tasks/[id]/route.ts`
- [ ] `app/api/purchases/route.ts`
- [ ] `app/api/purchases/[id]/route.ts`
- [ ] `app/api/chat/route.ts`

### 2. Store (Priority High)

- [ ] `lib/store.ts` (~ 500 lignes à réécrire)

### 3. Configuration (Priority High)

- [x] `lib/mongodb.ts` (✅ déjà créé)
- [ ] Supprimer `lib/db.ts` (SQLite)

### 4. Types (Priority Medium)

- [ ] `lib/types.ts` (adapter les IDs : number → ObjectId/string)

---

## 🚀 Déploiement Vercel (Après Migration)

### Étape 1 : Installer Vercel CLI

```bash
npm i -g vercel
```

### Étape 2 : Se Connecter

```bash
vercel login
```

### Étape 3 : Déployer

```bash
vercel
```

Suivez les instructions :
- Project name : `reno-planner`
- Deploy : `yes`

### Étape 4 : Ajouter les Variables d'Environnement

Dans le dashboard Vercel (https://vercel.com) :
1. Allez dans votre projet
2. Settings → Environment Variables
3. Ajoutez :
   - `OPENAI_API_KEY` = votre clé
   - `MONGODB_URI` = votre connection string

### Étape 5 : Redéployer

```bash
vercel --prod
```

### Étape 6 : Mettre à Jour l'App Mobile

Dans `capacitor.config.ts` :

```typescript
server: {
  url: 'https://votre-app.vercel.app',
  cleartext: false,
  androidScheme: 'https',
}
```

Puis :
```bash
npm run mobile:sync
```

---

## 💡 Ma Recommandation

### Pour Vous (Solution Plus Rapide)

Au lieu de MongoDB (qui nécessite beaucoup de refactoring), je recommande **Supabase** :

**Avantages** :
- ✅ **PostgreSQL** (SQL comme SQLite)
- ✅ Migration **beaucoup plus simple** (changement minimal)
- ✅ **Gratuit** jusqu'à 500MB
- ✅ ORM **Prisma** possible (facilite la migration)
- ✅ Compatible Vercel
- ✅ API REST générée automatiquement

**Migration Supabase = 1-2h au lieu de 6h**

Voulez-vous que je vous guide avec **Supabase à la place** ? C'est beaucoup plus rapide ! 🚀

---

## 🆘 Besoin d'Aide ?

Si vous voulez vraiment MongoDB, je peux :
1. Vous guider fichier par fichier
2. Créer des exemples de migration
3. Répondre à vos questions

Mais honnêtement, **Supabase** sera beaucoup plus rapide pour vous.

---

**Que préférez-vous ?**
- 🟢 **Option 1** : Continuer avec MongoDB (long mais faisable)
- 🟡 **Option 2** : Migrer vers Supabase (plus rapide et simple)
- 🔵 **Option 3** : Utiliser Railway avec SQLite (aucun changement de code)

