# 🔧 Résolution de l'Erreur 405 - Assistant IA

## 📋 Diagnostic

**Problème :** Erreur 405 (Method Not Allowed) lors de l'envoi de messages à l'assistant IA

**Cause :** Les routes API tentent d'utiliser MongoDB mais la variable `MONGODB_URI` n'est pas configurée, ce qui empêche Next.js de charger correctement les routes.

---

## ✅ Solution Rapide

### Étape 1 : Créer le fichier `.env.local`

Créez un fichier nommé `.env.local` à la racine du projet (au même niveau que `package.json`) avec le contenu suivant :

```env
# Base de données MongoDB
MONGODB_URI=votre_uri_mongodb_ici

# Clé API OpenAI pour l'assistant IA
OPENAI_API_KEY=votre_clé_openai_ici
```

### Étape 2 : Configurer MongoDB

Vous avez **3 options** :

#### Option A : MongoDB Atlas (Recommandé - Gratuit)

1. Créez un compte gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Créez un cluster gratuit (M0)
3. Cliquez sur "Connect" → "Connect your application"
4. Copiez l'URI de connexion (ressemble à ceci) :
   ```
   mongodb+srv://username:password@cluster.mongodb.net/renoplanner
   ```
5. Collez-la dans votre fichier `.env.local` :
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/renoplanner
   ```

#### Option B : MongoDB Local

Si vous avez MongoDB installé localement :

```env
MONGODB_URI=mongodb://localhost:27017/renoplanner
```

#### Option C : Utiliser SQLite (Développement local uniquement)

**Note :** Cette option nécessite de modifier les routes API pour utiliser SQLite au lieu de MongoDB. Si vous préférez cette option, consultez le fichier `lib/db.ts` (SQLite) vs `lib/db-mongo.ts` (MongoDB).

### Étape 3 : Configurer OpenAI (pour l'assistant IA)

1. Créez un compte sur [OpenAI](https://platform.openai.com/signup)
2. Obtenez une clé API depuis [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Ajoutez-la dans votre `.env.local` :
   ```env
   OPENAI_API_KEY=sk-proj-...votre_clé...
   ```

### Étape 4 : Redémarrer le serveur

1. Arrêtez le serveur Next.js (Ctrl+C)
2. Relancez-le :
   ```bash
   npm run dev
   ```

---

## 🧪 Vérification

Une fois configuré, testez votre application :

1. Ouvrez [http://localhost:3000](http://localhost:3000)
2. Créez un projet
3. Ouvrez l'assistant IA
4. Envoyez un message de test

L'erreur 405 devrait être résolue ! ✅

---

## 🆘 Problèmes Persistants ?

### Erreur : "MongoDB non configuré"

- Vérifiez que le fichier `.env.local` existe à la racine du projet
- Vérifiez que `MONGODB_URI` est bien défini (pas vide)
- Redémarrez le serveur Next.js

### Erreur : "OpenAI API key not found"

- Vérifiez que `OPENAI_API_KEY` est défini dans `.env.local`
- Vérifiez que la clé commence par `sk-`
- Redémarrez le serveur

### L'erreur 405 persiste

1. Supprimez le dossier `.next` :
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force .next
   
   # Ou manuellement, supprimez le dossier .next
   ```

2. Relancez le serveur :
   ```bash
   npm run dev
   ```

---

## 📝 Modifications Apportées

Les fichiers suivants ont été modifiés pour permettre un démarrage sans MongoDB :

1. **`lib/mongodb.ts`** : Ne lance plus d'erreur au démarrage si `MONGODB_URI` n'est pas défini
2. **`app/api/chat/route.ts`** : Correction du retour dans la fonction GET (pas de double wrapping)

---

## 🔍 Détails Techniques

### Structure de l'application

- **Routes API avec MongoDB** : `/api/projects`, `/api/rooms`, `/api/tasks`, `/api/purchases`
- **Route API avec SQLite** : `/api/chat`

Pour que toutes les fonctionnalités fonctionnent, MongoDB **doit** être configuré.

### Fichiers clés

- `lib/db.ts` → SQLite (utilisé par `/api/chat`)
- `lib/db-mongo.ts` → MongoDB (utilisé par toutes les autres routes)
- `lib/mongodb.ts` → Configuration de la connexion MongoDB

---

## 📚 Ressources

- [Documentation MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Documentation OpenAI](https://platform.openai.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Date de résolution :** ${new Date().toLocaleDateString('fr-FR')}

