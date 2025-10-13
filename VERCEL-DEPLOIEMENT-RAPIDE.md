# ⚡ Déploiement Vercel - Guide Rapide

## 🎯 Étapes Essentielles (5 minutes)

### 1️⃣ MongoDB Atlas - Préparation

**Accès Réseau :**
1. MongoDB Atlas → **Network Access**
2. **Add IP Address** → **Allow Access from Anywhere (0.0.0.0/0)**

**URI de Connexion :**
```
mongodb+srv://yoanblgr_db_user:<votre_password>@rennoplanner.yodgdjd.mongodb.net/?retryWrites=true&w=majority&appName=rennoplanner
```

⚠️ Remplacez `<votre_password>` par votre vrai mot de passe !

---

### 2️⃣ Vercel - Déploiement

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Add New... → Project**
3. **Import** : `yoyoboul/rennoplanner` depuis GitHub
4. **Environment Variables** - Ajoutez ces 2 variables :

```env
MONGODB_URI=mongodb+srv://yoanblgr_db_user:VotrePassword@rennoplanner...
OPENAI_API_KEY=sk-proj-votre_clé_openai
```

5. Cochez **Production**, **Preview**, et **Development**
6. Cliquez sur **Deploy** 🚀

---

### 3️⃣ Test

Attendez 1-2 minutes, puis :

1. Ouvrez `https://rennoplanner.vercel.app`
2. Créez un projet
3. Testez l'assistant IA : "Bonjour !"

✅ **Ça fonctionne ? Bravo, c'est déployé !**

---

## 🔑 Variables d'Environnement Requises

| Variable | Où la trouver ? |
|----------|-----------------|
| `MONGODB_URI` | MongoDB Atlas → Database → Connect → "Connect your application" |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

---

## 🆘 Problèmes ?

### L'application ne démarre pas

→ Vérifiez les **logs Vercel** (onglet "Logs")

### "MongoDB Connection Failed"

→ Vérifiez que **0.0.0.0/0** est dans Network Access (MongoDB Atlas)

### "OpenAI API Error"

→ Vérifiez que votre clé OpenAI est valide et que vous avez un moyen de paiement

---

## 🔄 Mises à Jour Automatiques

Après le premier déploiement, **tout est automatique** ! 🎉

```bash
git add .
git commit -m "Mes modifications"
git push origin main
```

→ Vercel détecte le push et redéploie automatiquement !

---

## 📚 Guide Complet

Pour plus de détails → **`DEPLOIEMENT-VERCEL-GUIDE-COMPLET.md`**

---

**Votre application sera accessible sur :**

🌐 **https://rennoplanner.vercel.app**

**Bon déploiement ! 🚀**

