# 📱 Guide de Build Mobile Optimisé - Reno Planner

Ce guide explique comment builder votre application mobile Android optimisée pour un téléphone.

## ✅ Optimisations Appliquées

### 1. **Configuration Viewport & Meta Tags**
- Meta viewport configuré pour s'adapter aux écrans mobiles
- Support des notchs iPhone X+ avec safe-area
- Configuration PWA pour une expérience app-like
- Theme color et status bar personnalisés

### 2. **Design Responsive Amélioré**
- Titres et textes adaptés aux petits écrans
- Boutons avec taille tactile minimale (44x44px)
- Tabs scrollables horizontalement sur mobile
- Grilles qui s'empilent verticalement sur mobile
- Formulaires optimisés avec champs plus grands (44px de hauteur)

### 3. **Optimisations CSS Mobile**
- Scroll natif iOS optimisé avec `-webkit-overflow-scrolling: touch`
- Prévention du zoom automatique sur les inputs (16px minimum)
- Feedback tactile sur les boutons avec animations
- Support des safe areas pour les appareils avec notch
- Prévention du pull-to-refresh natif

### 4. **Configuration Capacitor**
- Build statique Next.js exporté dans le dossier `out/`
- Plugins Capacitor optimisés (Keyboard, StatusBar, SplashScreen)
- Mode développement vs production automatique
- Debugging désactivé en production

### 5. **Performance**
- Export statique pour des temps de chargement ultra-rapides
- Images non optimisées (car export statique)
- Minification JavaScript activée (SWC)
- Headers HTTP optimisés

---

## 🚀 Comment Builder l'APK Optimisé

### Mode 1 : Build de Production (Recommandé)

Cette méthode crée un build statique optimisé qui sera embarqué dans l'APK.

```bash
# 1. Nettoyer les anciens builds (optionnel)
npm run mobile:clean

# 2. Builder l'app en mode production
npm run mobile:build:prod

# 3. Ouvrir Android Studio
npm run mobile:open
```

Dans Android Studio :
1. Attendez que Gradle termine la synchronisation
2. Menu `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
3. L'APK sera généré dans : `android/app/build/outputs/apk/debug/app-debug.apk`

### Mode 2 : Build Simple

```bash
# Build et sync avec Android
npm run mobile:build

# Ouvrir Android Studio
npm run mobile:open
```

### Mode 3 : Développement (Hot Reload)

Pour le développement avec rechargement en direct :

```bash
# 1. Démarrer le serveur Next.js
npm run dev

# 2. Dans un autre terminal, mettre à jour l'IP dans capacitor.config.ts
# Changez la ligne url: 'http://192.168.1.90:3000' avec votre IP locale

# 3. Sync et lancer
npm run mobile:sync
npm run mobile:run
```

> **Note** : En mode développement, l'app charge depuis votre serveur local. Votre téléphone doit être sur le même réseau WiFi.

---

## 📋 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `npm run mobile:build` | Build optimisé + sync Capacitor |
| `npm run mobile:build:prod` | Build production complet (nettoie tout avant) |
| `npm run mobile:open` | Ouvre Android Studio |
| `npm run mobile:sync` | Synchronise les changements avec Android |
| `npm run mobile:run` | Lance l'app sur un appareil/émulateur connecté |
| `npm run mobile:dev` | Démarre le serveur de développement Next.js |
| `npm run mobile:clean` | Nettoie tous les builds (out/, .next, android/build) |

---

## 🔧 Configuration des Modes

### Mode Production (app autonome)
- L'app fonctionne sans serveur
- Build statique embarqué dans l'APK
- Performances maximales
- Pas de debugging

**Variables d'environnement** :
```bash
MOBILE_BUILD=true NODE_ENV=production
```

### Mode Développement (serveur local)
- Hot reload activé
- Debugging avec Chrome DevTools
- Nécessite le serveur Next.js en cours d'exécution
- Changements instantanés

**Configuration** :
- Modifier l'IP dans `capacitor.config.ts` ligne 17

---

## 🎨 Différences Visuelles Mobile vs Desktop

### Sur Mobile (< 768px)

✅ **Améliorations automatiques** :
- Padding réduit (16px au lieu de 32px)
- Titres H1 plus petits (30px au lieu de 36px)
- Boutons pleine largeur sur les formulaires
- Textes plus courts avec des abréviations intelligentes
  - "Vue d'ensemble" → "Vue"
  - "Assistant IA" → "IA"
  - "Liste de Courses" → "Courses"
- Tabs scrollables horizontalement
- Grilles en une seule colonne
- Actions groupées dans un menu déroulant

### Sur Desktop (≥ 768px)

✅ **Interface complète** :
- Layout multi-colonnes
- Tous les labels complets
- Sidebar et panels larges
- Grilles en 2-3 colonnes

---

## 📱 Test sur Téléphone Physique

### Via USB (Recommandé)

1. Activez le mode développeur sur votre Android :
   - Paramètres → À propos du téléphone
   - Tapez 7 fois sur "Numéro de build"
   
2. Activez le débogage USB :
   - Paramètres → Options pour les développeurs
   - Activez "Débogage USB"

3. Connectez votre téléphone en USB

4. Lancez l'app :
```bash
npm run mobile:build:prod
npm run mobile:run
```

### Via APK Direct

1. Générez l'APK dans Android Studio (Build → Build APK)

2. Récupérez le fichier :
   - `android/app/build/outputs/apk/debug/app-debug.apk`

3. Transférez-le sur votre téléphone et installez-le

---

## 🐛 Résolution de Problèmes

### L'app ne se lance pas

```bash
# Nettoyer et rebuild complètement
npm run mobile:clean
npm run mobile:build:prod
```

### Erreur "webDir not found"

```bash
# Vérifier que le build existe
ls -la out/

# Si vide, rebuild
MOBILE_BUILD=true next build
```

### L'app affiche une page blanche

1. Vérifiez que le build s'est bien fait :
```bash
ls -la out/index.html
```

2. Vérifiez les logs dans Android Studio (Logcat)

3. Activez le debugging :
```typescript
// Dans capacitor.config.ts
webContentsDebuggingEnabled: true
```

4. Inspectez avec Chrome :
   - Ouvrez `chrome://inspect` dans Chrome
   - Votre app devrait apparaître

### Texte trop petit sur mobile

Vérifiez que les changements CSS sont bien appliqués :
```bash
# Rebuild complet
npm run mobile:clean
npm run mobile:build:prod
```

### L'app charge depuis le serveur en production

Assurez-vous de builder avec :
```bash
MOBILE_BUILD=true NODE_ENV=production next build
```

Ou utilisez simplement :
```bash
npm run mobile:build:prod
```

---

## 📊 Checklist Avant Release

- [ ] Build avec `npm run mobile:build:prod`
- [ ] Tester sur un téléphone physique
- [ ] Vérifier que l'app fonctionne sans WiFi (mode avion)
- [ ] Tester toutes les fonctionnalités principales
- [ ] Vérifier que les formulaires sont utilisables au doigt
- [ ] Tester la rotation de l'écran
- [ ] Vérifier les performances de scroll
- [ ] Tester sur différentes tailles d'écran si possible

---

## 🎯 Prochaines Étapes

### Pour une Release Store

1. **Générer un Keystore** :
```bash
keytool -genkey -v -keystore reno-planner.keystore -alias reno-planner -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configurer le Keystore** dans `android/app/build.gradle`

3. **Build Release APK/AAB** :
   - Menu → Build → Generate Signed Bundle / APK
   - Suivez l'assistant

### Améliorations Futures

- [ ] Icône et splash screen personnalisés
- [ ] Support du mode sombre natif
- [ ] Notifications push
- [ ] Mode offline complet avec cache
- [ ] Biométrie (empreinte/Face ID)
- [ ] Partage de projets

---

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Android Build Process](https://developer.android.com/studio/build)

---

**Version du guide** : 1.0  
**Dernière mise à jour** : Octobre 2025  
**Auteur** : Assistant IA


