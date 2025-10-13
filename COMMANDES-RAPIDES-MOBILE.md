# ⚡ Commandes Rapides - Mobile Optimisé

## 📱 Comment Utiliser l'App Mobile

### ⚠️ Important à Savoir

Votre app utilise des **API routes côté serveur** (base de données SQLite). Elle nécessite donc que le **serveur Next.js soit en cours d'exécution** sur votre ordinateur.

L'app mobile se connecte à votre serveur local via WiFi.

---

## 🚀 Lancer l'App sur Votre Téléphone

### Étape 1 : Trouver Votre IP Locale

```bash
# Sur Mac
ipconfig getifaddr en0

# Ou avec ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Notez votre IP (ex: `192.168.1.45`)

### Étape 2 : Mettre à Jour l'IP dans la Config

Éditez `capacitor.config.ts` ligne 13 :
```typescript
url: 'http://VOTRE_IP_LOCALE:3000',  // Ex: 'http://192.168.1.45:3000'
```

### Étape 3 : Synchroniser

```bash
npm run mobile:sync
```

### Étape 4 : Lancer le Serveur Next.js

```bash
# Terminal 1 - Serveur Next.js (DOIT RESTER OUVERT)
npm run dev
```

### Étape 5 : Lancer l'App

```bash
# Terminal 2
npm run mobile:run
```

Ou ouvrez Android Studio et lancez l'app depuis là :
```bash
npm run mobile:open
```

---

## ✅ Checklist de Connexion

Avant de lancer l'app, vérifiez :

- [ ] Serveur Next.js lancé (`npm run dev`)
- [ ] IP locale correcte dans `capacitor.config.ts`
- [ ] Téléphone et ordinateur sur **le même réseau WiFi**
- [ ] Firewall de votre ordinateur autorise le port 3000

---

## 🔧 Workflow Quotidien

### Développement

```bash
# Terminal 1 - Gardez-le ouvert en permanence
npm run dev

# Terminal 2 - Après modification du code
npm run mobile:sync  # Si nécessaire
```

Puis dans Android Studio : Run → Run 'app'

### Après Changement de Config

```bash
npm run mobile:sync
```

### Si l'App ne Fonctionne Plus

```bash
# 1. Vérifier que le serveur tourne
curl http://localhost:3000

# 2. Vérifier l'IP
ipconfig getifaddr en0

# 3. Re-sync
npm run mobile:sync

# 4. Rebuild dans Android Studio
```

---

## 📱 Sur Téléphone Physique

### Via USB Debug

1. **Activer le mode développeur** :
   - Paramètres → À propos
   - Taper 7× sur "Numéro de build"

2. **Activer débogage USB** :
   - Paramètres → Options développeur
   - Activer "Débogage USB"

3. **Connecter en USB** et lancer :
```bash
npm run mobile:run
```

### Via APK

1. Dans Android Studio : **Build → Build APK(s)**

2. Récupérer l'APK :
```bash
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Desktop/
```

3. **Transférer sur le téléphone et installer**

⚠️ **Attention** : L'APK aura besoin que votre serveur soit accessible sur le réseau !

---

## 🎨 Optimisations Appliquées

Même si l'app se connecte à un serveur, elle est **totalement optimisée pour mobile** :

✅ **Interface responsive** adaptée aux petits écrans  
✅ **Boutons tactiles** 44×44px minimum  
✅ **Textes lisibles** 16px minimum (pas de zoom automatique)  
✅ **Navigation optimisée** avec tabs scrollables  
✅ **Formulaires mobiles** avec champs agrandis  
✅ **Safe areas** pour notchs iPhone  
✅ **Feedback tactile** sur interactions  
✅ **Splash screen** personnalisé  
✅ **Status bar** colorée  

---

## 🐛 Résolution de Problèmes

### "Impossible de se connecter au serveur"

**Cause** : Le serveur Next.js n'est pas accessible

**Solutions** :
1. Vérifier que `npm run dev` tourne
2. Vérifier l'IP dans `capacitor.config.ts`
3. Vérifier le WiFi (même réseau)
4. Tester depuis le téléphone :
   ```
   http://VOTRE_IP:3000
   ```
   dans le navigateur mobile

### Page blanche au démarrage

**Solutions** :
1. Vérifier les logs dans Android Studio (Logcat)
2. Ouvrir Chrome DevTools : `chrome://inspect`
3. Re-sync : `npm run mobile:sync`

### App très lente

**Cause** : Connexion réseau lente

**Solutions** :
1. Rapprochez-vous du routeur WiFi
2. Vérifier que rien ne sature le réseau
3. Redémarrer le routeur

### Modifications CSS non visibles

```bash
npm run mobile:sync
# Puis rebuild dans Android Studio
```

---

## 📖 Documentation Complète

- `OPTIMISATIONS-MOBILE-APPLIQUEES.md` - Toutes les optimisations
- `GUIDE-BUILD-MOBILE-OPTIMISE.md` - Guide complet

---

## 🎯 Résumé en 3 Étapes

### 1️⃣ Configurer votre IP

```bash
# Trouver votre IP
ipconfig getifaddr en0

# Éditer capacitor.config.ts ligne 13
url: 'http://VOTRE_IP:3000'

# Sync
npm run mobile:sync
```

### 2️⃣ Lancer le serveur

```bash
npm run dev
```

### 3️⃣ Lancer l'app

```bash
npm run mobile:run
```

---

## 🔮 Future : App 100% Autonome

Pour avoir une app qui fonctionne **sans serveur**, il faudrait :

1. Migrer vers **Capacitor SQLite** (base de données côté mobile)
2. Supprimer toutes les **API routes**
3. Déplacer la logique vers **le client**

C'est un refactoring important mais possible ! Pour l'instant, le mode serveur fonctionne très bien.

---

**💡 L'essentiel** : Gardez `npm run dev` ouvert pendant que vous utilisez l'app mobile !
