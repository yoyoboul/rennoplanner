# 🚀 Guide de Déploiement sur Vercel avec MongoDB

## 📋 Prérequis

Avant de déployer sur Vercel, assurez-vous d'avoir :

✅ Un compte [Vercel](https://vercel.com) (gratuit)  
✅ Un compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratuit)  
✅ Une clé API [OpenAI](https://platform.openai.com/api-keys)  
✅ Votre code poussé sur GitHub (✅ **FAIT !**)

---

## 🗄️ Étape 1 : Configuration MongoDB Atlas

### 1.1 Créer/Vérifier votre Cluster

1. Connectez-vous sur [MongoDB Atlas](https://cloud.mongodb.com/)
2. Si vous n'avez pas de cluster, créez-en un :
   - Cliquez sur "Build a Database"
   - Choisissez le plan **M0 Sandbox (GRATUIT)**
   - Sélectionnez une région proche (ex: Paris, Frankfurt)
   - Nommez le cluster : `rennoplanner`
   - Cliquez sur "Create"

### 1.2 Configurer l'Accès Réseau

⚠️ **IMPORTANT** : Vercel doit pouvoir accéder à votre base de données

1. Dans MongoDB Atlas, allez dans **"Network Access"** (menu de gauche)
2. Cliquez sur **"Add IP Address"**
3. Cliquez sur **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Cliquez sur **"Confirm"**

> **Note :** Pour plus de sécurité en production, vous pouvez restreindre aux IP de Vercel plus tard.

### 1.3 Créer un Utilisateur de Base de Données

1. Allez dans **"Database Access"** (menu de gauche)
2. Cliquez sur **"Add New Database User"**
3. Choisissez **"Password"** comme méthode d'authentification
4. Définissez :
   - **Username** : `yoanblgr_db_user` (ou gardez celui existant)
   - **Password** : Créez un mot de passe **FORT** (notez-le !)
5. Dans **Database User Privileges**, sélectionnez **"Read and write to any database"**
6. Cliquez sur **"Add User"**

### 1.4 Récupérer l'URI de Connexion

1. Retournez dans **"Database"** (menu de gauche)
2. Cliquez sur **"Connect"** sur votre cluster
3. Choisissez **"Connect your application"**
4. Copiez l'URI de connexion (format : `mongodb+srv://...`)
5. **Remplacez `<password>` par votre mot de passe** dans l'URI

Exemple d'URI final :
```
mongodb+srv://yoanblgr_db_user:VotreMotDePasse@rennoplanner.yodgdjd.mongodb.net/?retryWrites=true&w=majority&appName=rennoplanner
```

⚠️ **Encodez les caractères spéciaux** si votre mot de passe en contient (voir `INSTRUCTIONS-ENV.md`)

---

## 🔑 Étape 2 : Obtenir une Clé OpenAI

1. Allez sur [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Connectez-vous (ou créez un compte)
3. Cliquez sur **"Create new secret key"**
4. Donnez un nom : `Rennoplanner Vercel`
5. **Copiez la clé** (elle commence par `sk-proj-...` ou `sk-...`)
6. ⚠️ **Sauvegardez-la quelque part**, vous ne pourrez plus la voir après !

> **Note :** Vous devrez ajouter un moyen de paiement sur OpenAI pour utiliser l'API (même en restant dans la limite gratuite).

---

## 🚀 Étape 3 : Déploiement sur Vercel

### 3.1 Importer le Projet depuis GitHub

1. Allez sur [Vercel](https://vercel.com)
2. Cliquez sur **"Add New..."** → **"Project"**
3. Dans **"Import Git Repository"**, trouvez `yoyoboul/rennoplanner`
4. Cliquez sur **"Import"**

### 3.2 Configurer les Variables d'Environnement

**⚠️ CRUCIAL** : Avant de déployer, ajoutez vos variables d'environnement !

1. Sur la page de configuration du projet, descendez jusqu'à **"Environment Variables"**

2. Ajoutez **2 variables** :

   **Variable 1 : MONGODB_URI**
   ```
   Nom  : MONGODB_URI
   Valeur : mongodb+srv://yoanblgr_db_user:VotreMotDePasse@rennoplanner.yodgdjd.mongodb.net/?retryWrites=true&w=majority&appName=rennoplanner
   ```

   **Variable 2 : OPENAI_API_KEY**
   ```
   Nom  : OPENAI_API_KEY
   Valeur : sk-proj-votre_clé_openai_ici
   ```

3. Pour chaque variable, assurez-vous que les 3 environnements sont cochés :
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### 3.3 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez environ 1-2 minutes
3. ✅ **Déploiement terminé !**

Votre application sera disponible sur : `https://rennoplanner.vercel.app`

---

## 🧪 Étape 4 : Vérification et Tests

### 4.1 Tester l'Application

1. Ouvrez votre URL Vercel : `https://rennoplanner.vercel.app`
2. Créez un nouveau projet
3. Ajoutez une pièce
4. Testez l'assistant IA :
   - Cliquez sur l'onglet "Assistant IA"
   - Envoyez : "Bonjour !"
   - Si l'IA répond, tout fonctionne ! ✅

### 4.2 Vérifier les Logs

Si quelque chose ne fonctionne pas :

1. Dans Vercel, allez sur votre projet
2. Cliquez sur l'onglet **"Logs"** ou **"Functions"**
3. Vérifiez les erreurs

**Erreurs courantes :**

- `MongoServerError: bad auth` → Mot de passe incorrect ou utilisateur mal configuré
- `OPENAI_API_KEY is not defined` → Clé OpenAI manquante dans les variables d'environnement
- `getaddrinfo ENOTFOUND` → Problème de connexion MongoDB (vérifier Network Access)

---

## 🔄 Étape 5 : Mises à Jour Futures

### Comment déployer de nouvelles modifications ?

C'est **automatique** ! 🎉

1. Modifiez votre code localement
2. Commitez et poussez sur GitHub :
   ```bash
   git add .
   git commit -m "Mes modifications"
   git push origin main
   ```
3. Vercel détecte automatiquement le push et redéploie ! 🚀

Vous recevrez une notification par email à chaque déploiement.

### Redéployer manuellement

Si vous voulez forcer un redéploiement :

1. Allez sur votre projet dans Vercel
2. Cliquez sur l'onglet **"Deployments"**
3. Sur le dernier déploiement, cliquez sur le menu **"..."**
4. Cliquez sur **"Redeploy"**

---

## 🔐 Étape 6 : Sécurité (Recommandations)

### 6.1 Limiter l'Accès MongoDB (Production)

Pour plus de sécurité, au lieu de "Allow Access from Anywhere" :

1. Allez dans MongoDB Atlas → **"Network Access"**
2. Obtenez les IP de Vercel (voir [documentation Vercel](https://vercel.com/docs/security/ip-addresses))
3. Ajoutez uniquement ces IP dans MongoDB Atlas

### 6.2 Limiter les Coûts OpenAI

1. Dans OpenAI, allez dans **"Settings"** → **"Billing"**
2. Définissez un **"Hard limit"** (ex: 10$/mois)
3. Vous recevrez des alertes si vous approchez de la limite

### 6.3 Variables d'Environnement

✅ **JAMAIS** de commit de `.env.local` dans Git (déjà dans `.gitignore`)  
✅ Changez vos mots de passe régulièrement  
✅ Utilisez des mots de passe forts et uniques

---

## 📊 Étape 7 : Monitoring

### Vercel Analytics (Optionnel)

1. Dans votre projet Vercel, allez dans l'onglet **"Analytics"**
2. Activez **"Web Analytics"** (gratuit)
3. Vous verrez les statistiques de visites et performances

### Vercel Logs

Pour voir les logs en temps réel :

1. Dans votre projet Vercel → Onglet **"Logs"**
2. Filtrez par fonction API (ex: `/api/chat`)
3. Debuggez les erreurs en temps réel

---

## 🆘 Dépannage

### Erreur : "Application Error"

**Cause :** Problème lors du démarrage de l'application

**Solutions :**
1. Vérifiez les logs Vercel
2. Vérifiez que `MONGODB_URI` et `OPENAI_API_KEY` sont bien configurés
3. Testez localement avec les mêmes variables d'environnement

### Erreur : "MongoDB Connection Failed"

**Cause :** Vercel ne peut pas se connecter à MongoDB

**Solutions :**
1. Vérifiez que "0.0.0.0/0" est dans Network Access (MongoDB Atlas)
2. Vérifiez que l'utilisateur a les bons droits
3. Testez l'URI avec MongoDB Compass localement

### Erreur : "OpenAI API Error"

**Cause :** Problème avec la clé API OpenAI

**Solutions :**
1. Vérifiez que la clé est valide (testez-la avec curl)
2. Vérifiez que vous avez un moyen de paiement sur OpenAI
3. Vérifiez les quotas OpenAI

### L'application est lente

**Cause :** MongoDB Atlas M0 (gratuit) a des limitations

**Solutions :**
1. C'est normal pour le plan gratuit
2. Optimisez les requêtes MongoDB (ajoutez des index)
3. Passez à M2 ($9/mois) si besoin de plus de performance

---

## 🎯 Checklist Complète

Avant de considérer le déploiement comme réussi :

- [ ] MongoDB Atlas configuré
- [ ] Network Access : 0.0.0.0/0 autorisé
- [ ] Utilisateur MongoDB créé avec droits "Read and write"
- [ ] URI MongoDB testée (avec MongoDB Compass)
- [ ] Clé OpenAI obtenue et testée
- [ ] Projet importé dans Vercel depuis GitHub
- [ ] Variables d'environnement configurées (MONGODB_URI, OPENAI_API_KEY)
- [ ] Premier déploiement réussi
- [ ] Application accessible sur `https://rennoplanner.vercel.app`
- [ ] Création d'un projet de test fonctionne
- [ ] Assistant IA répond correctement
- [ ] Historique des conversations sauvegardé

---

## 🌐 Domaine Personnalisé (Optionnel)

Si vous voulez utiliser votre propre domaine (ex: `renoplanner.fr`) :

1. Dans Vercel, allez dans votre projet → **"Settings"** → **"Domains"**
2. Ajoutez votre domaine
3. Suivez les instructions pour configurer le DNS
4. Vercel fournira automatiquement un certificat SSL (HTTPS)

---

## 📚 Ressources Utiles

- [Documentation Vercel](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## 🎉 Félicitations !

Votre application **Rennoplanner** est maintenant **déployée en production** ! 🚀

**URL de production :** https://rennoplanner.vercel.app

Partagez-la avec vos utilisateurs et profitez de votre application de gestion de rénovation avec IA ! 🏠✨

---

**Questions ? Problèmes ?**

Consultez les logs Vercel ou la documentation MongoDB/OpenAI.

**Bon déploiement ! 🚀**

