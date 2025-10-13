# 📱 Reno Planner - Application Android

## 🎉 Votre app est prête !

Votre application Next.js **Reno Planner** peut maintenant être transformée en application Android native grâce à **Capacitor**.

---

## 🚀 Démarrage en 3 étapes

### 1️⃣ Lancer le serveur API
```bash
npm run dev
```

### 2️⃣ Ouvrir Android Studio  
```bash
npm run mobile:open
```

### 3️⃣ Run l'app
Cliquez sur ▶️ dans Android Studio

**C'est tout ! 🎊**

---

## 📚 Documentation disponible

| Fichier | Description |
|---------|-------------|
| **[DEMARRAGE-RAPIDE-MOBILE.md](DEMARRAGE-RAPIDE-MOBILE.md)** | 🚀 Guide pour lancer l'app rapidement |
| **[MOBILE-BUILD.md](MOBILE-BUILD.md)** | 📦 Build APK, signature, déploiement |
| **[RECAP-MOBILE.md](RECAP-MOBILE.md)** | 📋 Récapitulatif complet de la config |

---

## 🛠️ Scripts npm disponibles

```bash
npm run mobile:open       # Ouvrir Android Studio
npm run mobile:sync       # Synchroniser les changements
npm run mobile:build      # Build Next.js + sync Android
npm run mobile:run        # Lancer sur appareil connecté
```

---

## ✅ Vérifier l'installation

```bash
./check-mobile-setup.sh
```

Ce script vérifie que tout est bien installé.

---

## 🏗️ Architecture

```
┌─────────────────────┐
│  App Android        │  ← Capacitor WebView
│  (UI = Next.js)     │
└──────────┬──────────┘
           │ HTTPS/HTTP
           ↓
┌─────────────────────┐
│  Serveur Next.js    │  ← API Routes
│  (Backend)          │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  SQLite Database    │  ← Données
└─────────────────────┘
```

**Avantages** :
- ✅ Même code que le web
- ✅ Mise à jour facile
- ✅ Pas de duplication
- ✅ Base centralisée

---

## 📱 Fonctionnalités

L'app mobile inclut **toutes** les fonctionnalités web :

- ✅ Gestion de projets de rénovation
- ✅ Planification de tâches avec calendrier
- ✅ Timeline interactive
- ✅ Kanban des tâches
- ✅ Liste de courses (Matériaux/Meubles)
- ✅ Gestion du budget en temps réel
- ✅ **Assistant IA (GPT-5)** pour conseils
- ✅ Statistiques et KPIs
- ✅ Mode hors ligne (quand API déployée localement)

---

## 🎯 Prochaines étapes

### Pour tester maintenant
1. Installer Android Studio (si pas fait)
2. `npm run dev` + `npm run mobile:open`
3. Créer un émulateur Android
4. Run !

### Pour utiliser en production
1. Déployer l'API (Vercel gratuit)
2. Modifier `capacitor.config.ts` avec l'URL de prod
3. Générer APK signé
4. Installer sur votre téléphone

### Pour publier sur Play Store
1. Créer compte développeur Google (25 USD)
2. Générer AAB signé
3. Préparer store listing
4. Publier !

Voir **[MOBILE-BUILD.md](MOBILE-BUILD.md)** pour les détails.

---

## 🐛 Support & Debugging

### Logs en temps réel
```bash
adb logcat | grep "Reno Planner"
```

### Inspecter avec Chrome DevTools
1. Ouvrir Chrome : `chrome://inspect`
2. Votre app apparaît dans la liste
3. Cliquer sur "Inspect"

### Problème de connexion ?
- Émulateur : URL = `http://10.0.2.2:3000`
- Appareil réel : Même WiFi + votre IP locale

---

## 📝 Configuration actuelle

- **App ID** : `com.renoplanner.app`
- **App Name** : Reno Planner
- **Server** : http://10.0.2.2:3000 (émulateur)
- **Platform** : Android (iOS possible mais non configuré)

---

## 🌟 Fonctionnalités techniques

- **Framework** : Next.js 15 + React 19
- **Mobile** : Capacitor 7
- **Database** : SQLite (better-sqlite3)
- **AI** : OpenAI GPT-5
- **Calendar** : react-big-calendar
- **Animations** : framer-motion
- **State** : Zustand
- **Validation** : Zod

---

## 💡 Astuces

- 🔥 **Hot Reload** : Modifiez le code → sauvegardez → l'app se rafraîchit !
- 🔍 **Chrome DevTools** fonctionne normalement
- 📱 Testez sur un **vrai appareil** pour la vraie expérience
- 🚀 Mode **debug** = lent, **release** = rapide

---

## 🎨 Personnalisation

### Icône
Générer sur : https://icon.kitchen/
Placer dans : `android/app/src/main/res/mipmap-*/`

### Nom de l'app
Modifier dans : `capacitor.config.ts`

### Splash screen
Modifier dans : `android/app/src/main/res/drawable/splash.png`

---

## ⚙️ Configuration avancée

Pour passer en mode production, voir la section "Option B" dans **[MOBILE-BUILD.md](MOBILE-BUILD.md)**.

---

## 📞 Besoin d'aide ?

1. Consulter les 3 docs fournies
2. Vérifier les logs : `adb logcat`
3. Tester avec Chrome DevTools : `chrome://inspect`

---

**🎊 Félicitations ! Vous avez maintenant une vraie app Android ! 📱✨**

Bon développement ! 🚀



