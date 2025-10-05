# 🚀 Déploiement Vercel - Guide Rapide

## ✅ ÉTAPE 1 : Repository GitHub - FAIT !

Votre code est maintenant sur : **https://github.com/yoyoboul/rennoplanner**

---

## 🌐 ÉTAPE 2 : Déployer sur Vercel (5 minutes)

### Méthode 1 : Interface Web (Recommandée)

1. **Créer un compte Vercel** (si ce n'est pas déjà fait)
   - Allez sur : https://vercel.com
   - Cliquez sur **"Sign Up"**
   - Choisissez **"Continue with GitHub"**
   - Autorisez l'accès

2. **Créer un nouveau projet**
   - Cliquez sur **"Add New..." → "Project"**
   - Sélectionnez votre repo : **`yoyoboul/rennoplanner`**
   - Cliquez sur **"Import"**

3. **Configurer les Variables d'Environnement**
   
   Avant de déployer, cliquez sur **"Environment Variables"** et ajoutez :

   | Name | Value |
   |------|-------|
   | `MONGODB_URI` | `mongodb+srv://yoanblgr_db_user:jzpwPIl6jpuLUfXT@rennoplanner.yodgdjd.mongodb.net/renoplanner?retryWrites=true&w=majority&appName=rennoplanner` |
   | `OPENAI_API_KEY` | `sk-votre-cle-openai-ici` |
   | `NODE_ENV` | `production` |

   ⚠️ **IMPORTANT** : Cochez **"Production"**, **"Preview"** et **"Development"** pour chaque variable

4. **Déployer !**
   - Cliquez sur **"Deploy"**
   - Attendez 2-5 minutes
   - Vous recevrez une URL : `https://rennoplanner-xxx.vercel.app`

---

### Méthode 2 : Vercel CLI (Alternative)

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Ajouter les variables d'environnement
vercel env add MONGODB_URI
vercel env add OPENAI_API_KEY
vercel env add NODE_ENV

# Déployer en production
vercel --prod
```

---

## 📱 ÉTAPE 3 : Connecter l'App Mobile

Une fois déployé, vous recevrez une URL comme : `https://rennoplanner-xxx.vercel.app`

### 1. Mettre à jour `capacitor.config.ts`

```typescript
server: {
  url: 'https://rennoplanner-xxx.vercel.app', // ⬅️ Votre URL Vercel
  cleartext: false, // HTTPS sécurisé
  androidScheme: 'https',
}
```

### 2. Reconstruire l'APK

```bash
npm run mobile:sync
npm run mobile:open

# Dans Android Studio :
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

### 3. Installer sur votre téléphone

L'APK généré se trouve dans :
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### 1. Tester l'URL Vercel

Dans votre navigateur, visitez : `https://votre-url.vercel.app`

Vous devriez voir l'interface de Reno Planner.

### 2. Tester l'API MongoDB

Créez un projet de test pour vérifier que la connexion MongoDB fonctionne.

### 3. Tester l'IA

Utilisez l'assistant IA pour créer une tâche et vérifier que OpenAI fonctionne.

---

## 🔧 DÉPANNAGE

### Erreur : "Cannot connect to MongoDB"

**Solution** :
1. Allez sur [MongoDB Atlas](https://cloud.mongodb.com)
2. **Network Access** → **Add IP Address**
3. Sélectionnez **"Allow Access from Anywhere"** (0.0.0.0/0)

### Erreur : "OpenAI API Error"

**Solution** :
Vérifiez que votre clé OpenAI est valide et a du crédit.

### L'app mobile ne se connecte pas

**Solution** :
1. Vérifiez l'URL dans `capacitor.config.ts`
2. Testez l'URL dans le navigateur mobile
3. Vérifiez les logs dans Android Studio (Logcat)

---

## 📊 MONITORING

### Vercel Dashboard

- **Functions** : Voir les logs des API routes
- **Analytics** : Suivre le trafic
- **Deployments** : Historique des déploiements

### MongoDB Atlas

- **Metrics** : Performance de la base
- **Alerts** : Configurer des alertes

---

## 🎉 FÉLICITATIONS !

Votre application est maintenant :
- ✅ Déployée sur Vercel
- ✅ Connectée à MongoDB Atlas
- ✅ Accessible depuis n'importe où
- ✅ 100% cloud et gratuit

**Prochaine étape** : Partagez l'URL avec vos amis ! 🚀

---

## 📞 LIENS UTILES

- **Votre repo GitHub** : https://github.com/yoyoboul/rennoplanner
- **Vercel Dashboard** : https://vercel.com/dashboard
- **MongoDB Atlas** : https://cloud.mongodb.com
- **Documentation Vercel** : https://vercel.com/docs

---

Date : Octobre 2025  
Version : 2.0 (MongoDB + Vercel Ready)  
Status : ✅ PRÊT POUR DÉPLOIEMENT
