# 🚀 GUIDE COMPLET : Déploiement Vercel + MongoDB

## 📋 Résumé de la Migration

✅ **Migration SQLite → MongoDB : TERMINÉE !**

- [x] Types MongoDB adaptés (`types-mongo.ts`)
- [x] Couche d'accès MongoDB (`db-mongo.ts`, `mongodb.ts`)
- [x] Toutes les API routes migrées (projects, rooms, tasks, purchases, chat)
- [x] Outils IA migrés (`ai-tools-mongo.ts`, `ai-tools-extended.ts`, `ai-context.ts`)
- [x] Driver MongoDB installé
- [x] Connexion MongoDB Atlas testée et fonctionnelle ✅

---

## 🎯 ÉTAPE 1 : Préparer le Déploiement

### 1.1 - Vérifier les Variables d'Environnement

Votre fichier `.env.local` actuel :
```bash
OPENAI_API_KEY=sk-votre-cle-api
MONGODB_URI=mongodb+srv://yoanblgr_db_user:jzpwPIl6jpuLUfXT@rennoplanner.yodgdjd.mongodb.net/renoplanner?retryWrites=true&w=majority&appName=rennoplanner
NODE_ENV=development
```

⚠️ **ATTENTION** : Ce fichier ne sera PAS déployé sur Vercel. On configurera ces variables dans Vercel.

### 1.2 - Tester le Build de Production

```bash
npm run build
```

✅ **Si ça compile avec succès**, vous êtes prêt à déployer !

---

## 🌐 ÉTAPE 2 : Déployer sur Vercel

### 2.1 - Créer un Compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **Sign Up**
3. Connectez-vous avec votre compte **GitHub** (recommandé)

### 2.2 - Créer un Repository GitHub

**Option A : Si vous n'avez pas encore de repo GitHub**
```bash
cd /Users/yoan/reno-planner

# Initialiser git (si ce n'est pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Migration MongoDB terminée"

# Créer un repo sur GitHub et le lier
# (Suivez les instructions sur github.com/new)
git remote add origin https://github.com/VOTRE-USERNAME/reno-planner.git
git branch -M main
git push -u origin main
```

**Option B : Si vous avez déjà un repo**
```bash
cd /Users/yoan/reno-planner
git add .
git commit -m "Migration MongoDB + ajout support Vercel"
git push
```

### 2.3 - Importer le Projet dans Vercel

1. **Connectez-vous à Vercel**
2. Cliquez sur **"Add New..." → "Project"**
3. **Importez votre repository GitHub** `reno-planner`
4. Vercel détectera automatiquement Next.js

### 2.4 - Configurer les Variables d'Environnement

Dans Vercel, avant de déployer :

1. Cliquez sur **"Environment Variables"**
2. Ajoutez ces 3 variables :

| Name | Value | Environment |
|------|-------|-------------|
| `OPENAI_API_KEY` | `sk-votre-vraie-cle` | Production, Preview, Development |
| `MONGODB_URI` | `mongodb+srv://yoanblgr_db_user:jzpwPIl6jpuLUfXT@rennoplanner.yodgdjd.mongodb.net/renoplanner?retryWrites=true&w=majority&appName=rennoplanner` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

⚠️ **IMPORTANT** : 
- Remplacez `sk-votre-vraie-cle` par votre vraie clé OpenAI
- Vérifiez que l'URI MongoDB est correcte

### 2.5 - Déployer !

1. Cliquez sur **"Deploy"**
2. Attendez 2-5 minutes
3. Vercel vous donnera une URL : `https://reno-planner-xxx.vercel.app`

🎉 **Votre application est maintenant en ligne !**

---

## 📱 ÉTAPE 3 : Connecter l'App Mobile à Vercel

### 3.1 - Mettre à Jour `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.renoplanner.app',
  appName: 'Reno Planner',
  webDir: 'out',

  // Configuration serveur - pointer vers Vercel
  server: {
    url: 'https://reno-planner-xxx.vercel.app', // ⬅️ Votre URL Vercel
    cleartext: false, // HTTPS sécurisé
    androidScheme: 'https',
  },

  android: {
    allowMixedContent: false, // HTTPS uniquement
    captureInput: true,
    webContentsDebuggingEnabled: false, // Désactiver en production
    backgroundColor: '#ffffff',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#3b82f6',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#3b82f6',
    },
  },
};

export default config;
```

### 3.2 - Reconstruire l'APK

```bash
# Synchroniser avec Capacitor
npm run mobile:sync

# Ouvrir Android Studio
npm run mobile:open

# Dans Android Studio :
# 1. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 2. Installer sur votre téléphone
```

### 3.3 - Tester l'Application

✅ **L'application fonctionne maintenant sans PC !**
- Les données sont stockées sur MongoDB Atlas (cloud)
- Le serveur tourne sur Vercel (cloud)
- Votre téléphone se connecte directement via HTTPS

---

## 🔧 ÉTAPE 4 : Configuration Post-Déploiement

### 4.1 - MongoDB Atlas : Whitelist IPs

Par défaut, MongoDB Atlas bloque toutes les IPs. Pour Vercel :

1. Allez sur [MongoDB Atlas](https://cloud.mongodb.com)
2. **Network Access** (dans le menu de gauche)
3. Cliquez sur **"Add IP Address"**
4. Sélectionnez **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ **Alternative sécurisée** : Ajoutez uniquement les IPs de Vercel
   - Voir : [Vercel IP Ranges](https://vercel.com/docs/concepts/edge-network/regions#ip-addresses)

### 4.2 - Domaine Personnalisé (Optionnel)

Si vous voulez `reno-planner.com` au lieu de `reno-planner-xxx.vercel.app` :

1. Dans Vercel : **Settings → Domains**
2. Ajoutez votre domaine
3. Suivez les instructions pour configurer les DNS

### 4.3 - Variables Locales vs Production

**Développement Local** (.env.local) :
```bash
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
```

**Production Vercel** (Environment Variables) :
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
```

---

## 🐛 DÉPANNAGE

### Problème 1 : "Error connecting to MongoDB"

**Solution** :
1. Vérifiez que l'IP de Vercel est whitelistée dans MongoDB Atlas
2. Vérifiez que `MONGODB_URI` est bien configurée dans Vercel
3. Testez la connexion localement : `node scripts/test-mongodb.js`

### Problème 2 : "500 Internal Server Error"

**Solution** :
1. Allez dans **Vercel Dashboard → Votre projet → Functions**
2. Cliquez sur une fonction pour voir les **logs**
3. Identifiez l'erreur exacte

### Problème 3 : L'app mobile ne se connecte pas

**Solution** :
1. Vérifiez que l'URL dans `capacitor.config.ts` est correcte
2. Testez l'URL dans votre navigateur mobile
3. Vérifiez les **CORS** si nécessaire

### Problème 4 : "Cannot find module 'mongodb'"

**Solution** :
```bash
npm install mongodb
npm install @types/node
```

---

## 📊 MONITORING & PERFORMANCE

### Vercel Analytics

Activez **Vercel Analytics** pour surveiller :
- Temps de chargement
- Erreurs
- Trafic
- Performance des API

**Activation** :
1. Vercel Dashboard → Votre projet
2. **Analytics** → **Enable**

### MongoDB Atlas Monitoring

Surveillez votre base de données :
1. MongoDB Atlas Dashboard
2. **Metrics** → Performance
3. Configurez des **Alerts** si le stockage dépasse 90%

---

## 💰 COÛTS

### MongoDB Atlas (Free Tier)
- ✅ **512 MB de stockage** : GRATUIT
- ✅ **Backup automatique** : GRATUIT
- ✅ **Connexions illimitées** : GRATUIT

**Estimation** : Votre projet devrait rester dans le tier gratuit pendant longtemps (milliers de projets avant de dépasser 512 MB).

### Vercel (Free Tier)
- ✅ **100 GB de bande passante** : GRATUIT
- ✅ **Builds illimités** : GRATUIT
- ✅ **Domaines personnalisés** : GRATUIT

**Limitation** : 
- Temps d'exécution des fonctions : 10 secondes max (largement suffisant)
- Déploiements : illimités

---

## 🎓 COMMANDES UTILES

### Développement Local
```bash
# Lancer le serveur de dev
npm run dev

# Tester la connexion MongoDB
node scripts/test-mongodb.js

# Build de production
npm run build
```

### Mobile
```bash
# Synchroniser avec Capacitor
npm run mobile:sync

# Ouvrir Android Studio
npm run mobile:open
```

### Git & Déploiement
```bash
# Commit et push (Vercel redéploiera automatiquement)
git add .
git commit -m "Update: description des changements"
git push
```

---

## ✅ CHECKLIST FINALE

Avant de considérer le déploiement comme terminé :

- [ ] MongoDB Atlas configuré et testé
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Application déployée sur Vercel
- [ ] URL Vercel testée dans le navigateur
- [ ] Mobile app mise à jour avec l'URL Vercel
- [ ] APK rebuild et installé sur le téléphone
- [ ] Test complet de l'app mobile (création projet, tâches, IA, etc.)
- [ ] IPs Vercel whitelistées dans MongoDB Atlas
- [ ] Monitoring activé (Vercel Analytics + MongoDB Alerts)

---

## 🎉 FÉLICITATIONS !

Votre application **Reno Planner** est maintenant :
- ✅ **100% cloud** : Fonctionne sans votre PC
- ✅ **Scalable** : MongoDB + Vercel s'adaptent automatiquement
- ✅ **Gratuit** : Free tier pour tout
- ✅ **Mobile-ready** : APK optimisé et fonctionnel
- ✅ **Production-ready** : Architecture professionnelle

---

## 📞 SUPPORT

**Problème ?** Vérifiez :
1. Les logs Vercel : `https://vercel.com/dashboard`
2. Les logs MongoDB : `https://cloud.mongodb.com`
3. Les logs Android : Android Studio → Logcat

**Documentation** :
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Capacitor Docs](https://capacitorjs.com/docs)

---

**Date de migration** : Octobre 2025  
**Version** : 2.0 (MongoDB + Vercel)

