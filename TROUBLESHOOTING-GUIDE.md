# 🔧 Guide de Dépannage - RennoPlanner

## ❌ Erreur 500 - Création de Projet

### Symptôme
```
POST http://localhost:3000/api/projects 500 (Internal Server Error)
```

### Causes Possibles

#### 1. MongoDB Non Configuré
**Solution:**
```bash
# Vérifier que MongoDB URI est défini
# Dans .env.local:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rennoplanner

# OU pour local:
MONGODB_URI=mongodb://localhost:27017/rennoplanner
```

#### 2. MongoDB Non Démarré (Local)
**Solution:**
```bash
# Windows
net start MongoDB

# Mac/Linux
brew services start mongodb-community
# ou
sudo systemctl start mongod
```

#### 3. Connexion MongoDB Échouée
**Diagnostic:**
```bash
# Tester la connexion
node scripts/test-mongodb.js
```

**Solution:**
- Vérifier les credentials MongoDB Atlas
- Vérifier l'IP whitelist sur MongoDB Atlas
- Vérifier le firewall local

#### 4. Collection/Index Manquant
**Solution:**
```bash
# Migrer depuis SQLite si nécessaire
node scripts/migrate-sqlite-to-mongodb.js

# Ou créer manuellement les collections
```

### Fix Rapide - Retour à SQLite

Si MongoDB pose problème, vous pouvez temporairement revenir à SQLite :

1. **Modifier `app/api/projects/route.ts`:**
```typescript
// Remplacer:
import { getAllProjects, createProject } from '@/lib/db-mongo';

// Par:
import { getAllProjects, createProject } from '@/lib/db';
```

2. **Faire de même pour tous les fichiers API:**
- `app/api/projects/[id]/route.ts`
- `app/api/rooms/route.ts`
- `app/api/rooms/[id]/route.ts`
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/purchases/route.ts`
- `app/api/purchases/[id]/route.ts`
- `app/api/chat/route.ts`

3. **Redémarrer le serveur:**
```bash
npm run dev
```

### Vérifications Système

#### 1. Variables d'Environnement
```bash
# Vérifier .env.local
cat .env.local

# Doit contenir:
MONGODB_URI=...
OPENAI_API_KEY=...
```

#### 2. Dépendances
```bash
# Réinstaller si nécessaire
npm install

# Vérifier mongodb package
npm list mongodb
```

#### 3. Port Disponible
```bash
# Vérifier que 3000 est libre
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux
```

### Logs de Debug

Pour obtenir plus d'informations sur l'erreur:

1. **Consulter les logs serveur dans le terminal**
2. **Vérifier les logs MongoDB**
3. **Activer le mode verbose:**

```typescript
// Dans lib/db-mongo.ts
// Ajouter au début:
if (process.env.NODE_ENV === 'development') {
  console.log('MongoDB URI:', process.env.MONGODB_URI?.substring(0, 20) + '...');
}
```

## 🔄 Autres Erreurs Courantes

### Erreur: Module not found
**Cause:** Import manquant ou chemin incorrect

**Solution:**
```bash
# Vérifier les imports
# Réinstaller les dépendances
npm install
```

### Erreur: Hydration mismatch
**Cause:** Différence entre rendu serveur et client

**Solution:**
- Utiliser `'use client'` pour composants interactifs
- Vérifier les conditions de rendu
- Clear cache: `rm -rf .next`

### Erreur: CORS
**Cause:** Requêtes cross-origin bloquées

**Solution:**
```typescript
// Dans next.config.ts
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

### Performance Lente
**Solutions:**
1. Vérifier les requêtes API (Network tab)
2. Optimiser les re-renders (React DevTools Profiler)
3. Lazy load composants lourds
4. Virtualiser longues listes

## 🆘 Support Rapide

### Commandes de Diagnostic
```bash
# Vérifier la santé du projet
npm run build

# Vérifier les types
npx tsc --noEmit

# Linter
npm run lint

# Tester MongoDB
node scripts/test-mongodb.js

# Vérifier le déploiement
node scripts/verify-deployment-ready.js
```

### Reset Complet
```bash
# Supprimer tout et recommencer
rm -rf node_modules .next
npm install
npm run dev
```

### Base de Données Fresh Start
```bash
# SQLite
rm reno-planner.db

# MongoDB - Via Atlas UI ou:
# Supprimer toutes les collections et recréer
```

## 📞 Obtenir de l'Aide

1. **Consulter les docs:**
   - [Next.js Docs](https://nextjs.org/docs)
   - [MongoDB Docs](https://www.mongodb.com/docs/)
   - [React Docs](https://react.dev/)

2. **Vérifier les issues GitHub** (si projet open source)

3. **Logs détaillés:**
   - Terminal serveur
   - Browser console
   - Network tab

## ✅ Checklist Avant Production

- [ ] Variables d'environnement configurées
- [ ] MongoDB connecté et testé
- [ ] Build production réussit (`npm run build`)
- [ ] Pas d'erreurs TypeScript
- [ ] Tests passent (si existants)
- [ ] Performance acceptable (Lighthouse)
- [ ] Accessibilité validée
- [ ] Mobile testé
- [ ] OpenAI API key configurée et testée

---

**Note:** Les améliorations UX/UI implémentées sont indépendantes de ces erreurs serveur. Elles fonctionneront une fois le backend correctement configuré.

