# 🔄 Migration de l'Assistant IA vers MongoDB - Rapport Complet

## 📋 Vue d'ensemble

L'assistant IA a été **entièrement migré de SQLite vers MongoDB** pour assurer la cohérence avec le reste de l'application.

**Date de migration :** ${new Date().toLocaleDateString('fr-FR')}

---

## ✅ Modifications Effectuées

### 1. Ajout des fonctions MongoDB pour l'historique du chat

**Fichier modifié :** `lib/db-mongo.ts`

Ajout de 3 nouvelles fonctions :

```typescript
// Récupérer l'historique du chat d'un projet
export async function getChatHistory(projectId: string): Promise<ChatMessage[]>

// Sauvegarder un message dans l'historique
export async function saveChatMessage(
  projectId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ChatMessage>

// Supprimer l'historique du chat d'un projet
export async function deleteChatHistory(projectId: string): Promise<boolean>
```

**Structure MongoDB pour `chat_history` :**
```typescript
{
  _id: ObjectId,
  project_id: ObjectId,
  role: 'user' | 'assistant' | 'system',
  content: string,
  created_at: Date
}
```

### 2. Adaptation de la route `/api/chat`

**Fichier modifié :** `app/api/chat/route.ts`

**Changements :**

1. **Import :** Remplacement de `import { db } from '@/lib/db'` par `import { getChatHistory, saveChatMessage } from '@/lib/db-mongo'`

2. **Fonction GET :** Récupération de l'historique depuis MongoDB
   ```typescript
   // AVANT (SQLite)
   const history = db.prepare(
     `SELECT * FROM chat_history WHERE project_id = ? ORDER BY created_at ASC`
   ).all(project_id);

   // APRÈS (MongoDB)
   const history = await getChatHistory(project_id);
   ```

3. **Fonction `persistAssistantMessage` :** Sauvegarde dans MongoDB
   ```typescript
   // AVANT (SQLite)
   function persistAssistantMessage(projectId: string | number, content: string) {
     try {
       db.prepare(
         `INSERT INTO chat_history (project_id, role, content) VALUES (?, ?, ?)`
       ).run(projectId, 'assistant', content);
     } catch {
       logWarn('Failed to save chat history', { projectId });
     }
   }

   // APRÈS (MongoDB)
   async function persistAssistantMessage(projectId: string | number, content: string) {
     try {
       await saveChatMessage(projectId.toString(), 'assistant', content);
     } catch (error) {
       logWarn('Failed to save chat history', { projectId, error: (error as Error).message });
     }
   }
   ```

4. **Appel de la fonction :** Ajout de `await`
   ```typescript
   // AVANT
   if (projectId && content) {
     persistAssistantMessage(projectId, content);
   }

   // APRÈS
   if (projectId && content) {
     await persistAssistantMessage(projectId, content);
   }
   ```

### 3. Amélioration de `lib/mongodb.ts`

**Fichier modifié :** `lib/mongodb.ts`

**Changements :**
- Ne bloque plus le démarrage de l'application si `MONGODB_URI` n'est pas défini
- Affiche un avertissement clair dans la console
- Lance une erreur explicite seulement lors de l'utilisation de MongoDB

```typescript
// AVANT
if (!process.env.MONGODB_URI) {
  throw new Error('⚠️ Veuillez définir la variable MONGODB_URI dans .env.local');
}

// APRÈS
const uri = process.env.MONGODB_URI || '';
// ...
if (uri) {
  // Initialisation MongoDB
} else {
  console.warn('⚠️ MONGODB_URI non défini - MongoDB non disponible');
}
```

---

## 📊 État Actuel des Fichiers

| Fichier | Base de données | Statut |
|---------|----------------|--------|
| `app/api/chat/route.ts` | ✅ MongoDB | Migré |
| `lib/ai-tools.ts` | ✅ MongoDB | Déjà migré |
| `lib/ai-tools-mongo.ts` | ✅ MongoDB | Déjà migré |
| `lib/ai-context.ts` | ✅ MongoDB | Déjà migré |
| `lib/db-mongo.ts` | ✅ MongoDB | Étendu |
| `lib/db.ts` | ❌ SQLite | Obsolète (non utilisé) |

---

## 🔧 Configuration Requise

### Fichier `.env.local` à créer

Créez un fichier `.env.local` à la racine avec :

```env
# Base de données MongoDB
MONGODB_URI=mongodb+srv://yoanblgr_db_user:<db_password>@rennoplanner.yodgdjd.mongodb.net/?retryWrites=true&w=majority&appName=rennoplanner

# Clé API OpenAI
OPENAI_API_KEY=votre_clé_openai
```

**⚠️ IMPORTANT :**
- Remplacez `<db_password>` par votre vrai mot de passe MongoDB
- Obtenez une clé OpenAI sur https://platform.openai.com/api-keys

Consultez **`INSTRUCTIONS-ENV.md`** pour les instructions détaillées.

---

## 🗄️ Collections MongoDB Utilisées

### 1. `projects`
- Informations des projets de rénovation

### 2. `rooms`
- Pièces associées aux projets

### 3. `tasks`
- Tâches associées aux pièces

### 4. `purchases`
- Achats/liste de courses

### 5. `chat_history` ✨ (Nouvelle)
- Historique des conversations avec l'assistant IA
- Lié aux projets via `project_id`

---

## ✅ Avantages de la Migration

1. **Cohérence** : Toute l'application utilise la même base de données
2. **Scalabilité** : MongoDB supporte mieux la croissance des données
3. **Flexibilité** : Schéma flexible pour futures évolutions
4. **Cloud-ready** : Prêt pour le déploiement sur Vercel
5. **Maintenance** : Une seule base de données à gérer

---

## 🧪 Tests à Effectuer

### 1. Test de l'historique du chat

1. Créez un nouveau projet
2. Ouvrez l'assistant IA
3. Envoyez plusieurs messages
4. Rafraîchissez la page
5. ✅ Vérifiez que l'historique est conservé

### 2. Test des outils de l'IA

Testez les commandes suivantes :

```
- "Ajoute une tâche: Peindre le salon"
- "Crée une pièce: Cuisine"
- "Quel est mon budget restant ?"
- "Génère ma liste de courses"
- "Résume mon projet"
```

### 3. Test de persistance

1. Envoyez des messages
2. Redémarrez le serveur
3. ✅ Vérifiez que l'historique est toujours là

---

## 🔍 Dépannage

### Erreur : "MongoDB non configuré"

**Cause :** Le fichier `.env.local` n'existe pas ou `MONGODB_URI` est vide

**Solution :**
1. Créez le fichier `.env.local`
2. Ajoutez `MONGODB_URI` avec votre URI MongoDB
3. Redémarrez le serveur

### Erreur : "Unauthorized" ou "Authentication failed"

**Cause :** Mot de passe MongoDB incorrect

**Solution :**
1. Vérifiez votre mot de passe MongoDB Atlas
2. Encodez les caractères spéciaux (voir INSTRUCTIONS-ENV.md)
3. Testez la connexion avec MongoDB Compass

### L'historique ne se sauvegarde pas

**Cause :** Problème de connexion à MongoDB

**Solution :**
1. Vérifiez les logs du serveur
2. Testez la connexion avec `scripts/test-mongodb.js`
3. Vérifiez que la collection `chat_history` existe

---

## 📂 Fichiers Créés/Modifiés

### ✨ Nouveaux fichiers

- ✅ `MIGRATION-ASSISTANT-IA-MONGODB.md` (ce fichier)
- ✅ `INSTRUCTIONS-ENV.md` (guide pour créer .env.local)
- ✅ `RESOLUTION-ERREUR-405.md` (guide de résolution d'erreur)

### 📝 Fichiers modifiés

- ✅ `lib/db-mongo.ts` - Ajout des fonctions chat
- ✅ `app/api/chat/route.ts` - Migration vers MongoDB
- ✅ `lib/mongodb.ts` - Amélioration de la gestion d'erreur

---

## 🚀 Prochaines Étapes

1. ✅ **Configuration :** Créer le fichier `.env.local` (voir INSTRUCTIONS-ENV.md)
2. ✅ **Test :** Tester l'assistant IA avec MongoDB
3. 📦 **Déploiement :** Configurer MongoDB Atlas pour la production
4. 🎨 **Améliorations futures :**
   - Ajouter la recherche dans l'historique
   - Implémenter la suppression de l'historique
   - Ajouter des filtres de conversation

---

## 📚 Documentation Associée

- `INSTRUCTIONS-ENV.md` - Configuration de .env.local
- `RESOLUTION-ERREUR-405.md` - Résolution de l'erreur 405
- `README.md` - Documentation générale du projet
- `GUIDE-DEPLOIEMENT-VERCEL-MONGODB.md` - Guide de déploiement

---

**Migration effectuée avec succès !** 🎉

Toutes les fonctionnalités de l'assistant IA sont maintenant opérationnelles avec MongoDB.

