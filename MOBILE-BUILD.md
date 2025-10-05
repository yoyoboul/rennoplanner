# 📱 Guide de build mobile pour Reno Planner

Ce guide vous explique comment créer l'APK Android de Reno Planner.

## 🔧 Prérequis

### 1. Installer Android Studio
- Télécharger : https://developer.android.com/studio
- Installer Android SDK 33 ou supérieur
- Configurer les variables d'environnement :
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

### 2. Installer Java JDK 17
- Télécharger : https://www.oracle.com/java/technologies/downloads/
- Vérifier : `java -version`

### 3. Installer Gradle (optionnel, inclus dans Android Studio)
- Android Studio inclut déjà Gradle

## 🚀 Étapes de build

### Option A : Développement avec serveur local

**1. Lancer le serveur API en arrière-plan**
```bash
npm run dev
```
Le serveur API doit tourner sur http://localhost:3000

**2. Dans un autre terminal, initialiser Capacitor**
```bash
# Première fois seulement
npm run mobile:init
npm run mobile:add:android
```

**3. Modifier capacitor.config.ts**
Pour Android Emulator, l'IP localhost est `10.0.2.2`:
```typescript
server: {
  url: 'http://10.0.2.2:3000',
  cleartext: true
}
```

Pour un appareil physique sur le même réseau WiFi:
```typescript
server: {
  url: 'http://[VOTRE_IP_LOCAL]:3000', // Ex: http://192.168.1.10:3000
  cleartext: true
}
```

**4. Synchroniser et ouvrir**
```bash
npm run mobile:sync
npm run mobile:open
```

**5. Dans Android Studio**
- Cliquer sur "Run" (icône ▶️)
- Sélectionner un émulateur ou appareil
- L'app se lance et communique avec votre API locale

---

### Option B : Build pour production (avec API déployée)

**1. Déployer votre API**
- Option recommandée : Vercel (gratuit)
  ```bash
  npm install -g vercel
  vercel
  ```
- Notez l'URL de déploiement (ex: https://reno-planner.vercel.app)

**2. Mettre à jour capacitor.config.ts**
```typescript
server: {
  url: 'https://votre-domaine.vercel.app',
  androidScheme: 'https'
}
```

**3. Build Next.js**
```bash
npm run build
```

**4. Synchroniser avec Android**
```bash
npm run mobile:sync
```

**5. Générer l'APK dans Android Studio**

a. Ouvrir le projet :
```bash
npm run mobile:open
```

b. Dans Android Studio :
- Menu : Build > Generate Signed Bundle / APK
- Sélectionner "APK"
- Créer un nouveau Keystore :
  - Key store path: choisir un emplacement
  - Password: créer un mot de passe fort
  - Alias: "reno-planner"
  - Validity: 25 years (minimum pour Play Store)
  - First and Last Name: Votre nom
  
c. Sélectionner "release"

d. L'APK sera généré dans :
```
android/app/release/app-release.apk
```

---

## 📲 Installation de l'APK

### Sur un émulateur
```bash
adb install android/app/release/app-release.apk
```

### Sur un appareil physique

**Méthode 1 : Via USB**
1. Activer "Options développeur" sur Android :
   - Paramètres > À propos du téléphone
   - Appuyer 7 fois sur "Numéro de build"
2. Activer "Débogage USB"
3. Connecter l'appareil au PC
4. ```bash
   adb install android/app/release/app-release.apk
   ```

**Méthode 2 : Transfert direct**
1. Copier `app-release.apk` sur le téléphone
2. Ouvrir le fichier avec un explorateur de fichiers
3. Autoriser l'installation depuis des sources inconnues
4. Installer

---

## 🔍 Debugging

### Voir les logs en temps réel
```bash
# Logs généraux
adb logcat

# Logs Chromium (web)
adb logcat | grep Chromium

# Logs de l'app spécifiquement
adb logcat | grep "Reno Planner"
```

### Inspecter l'app web dans Chrome
1. Ouvrir Chrome sur PC
2. Aller sur `chrome://inspect`
3. Votre app apparaîtra dans la liste
4. Cliquer sur "Inspect"
5. Utiliser les DevTools comme pour un site web

### Erreurs courantes

**Erreur : "cleartext traffic not permitted"**
- Solution : Ajouter `android:usesCleartextTraffic="true"` dans `android/app/src/main/AndroidManifest.xml`

**Erreur : "Unable to connect to server"**
- Vérifier que le serveur API tourne
- Pour émulateur : utiliser `10.0.2.2` au lieu de `localhost`
- Pour appareil physique : être sur le même WiFi

**L'app est lente**
- Mode debug : normal
- Build en mode release pour de meilleures performances

---

## 🎨 Personnalisation

### Changer l'icône de l'app
1. Générer des icônes : https://icon.kitchen/
2. Remplacer les fichiers dans :
   ```
   android/app/src/main/res/
   ├── mipmap-hdpi/
   ├── mipmap-mdpi/
   ├── mipmap-xhdpi/
   ├── mipmap-xxhdpi/
   └── mipmap-xxxhdpi/
   ```

### Changer le splash screen
1. Éditer `android/app/src/main/res/drawable/splash.png`

### Changer le nom de l'app
1. Modifier dans `capacitor.config.ts`
2. Modifier dans `android/app/src/main/res/values/strings.xml`

---

## 📦 Publication sur Google Play Store

1. **Créer un compte développeur**
   - Coût : 25 USD (one-time)
   - URL : https://play.google.com/console

2. **Préparer le store listing**
   - Captures d'écran (minimum 2)
   - Icône haute résolution (512x512px)
   - Description courte et longue
   - Politique de confidentialité

3. **Générer un Bundle (AAB) au lieu d'APK**
   - Dans Android Studio : Build > Generate Signed Bundle
   - Sélectionner "Android App Bundle"
   - Plus optimisé que APK pour Play Store

4. **Upload et publication**
   - Aller dans Play Console
   - Créer une nouvelle application
   - Upload le fichier .aab
   - Remplir les informations
   - Soumettre pour review

---

## 🔄 Mise à jour de l'app

Quand vous modifiez le code :

```bash
# 1. Rebuild Next.js
npm run build

# 2. Sync avec Android
npm run mobile:sync

# 3. Dans Android Studio, rebuild et run
```

---

## 💡 Astuces

### Développement rapide
- Utilisez le Hot Reload de Next.js
- L'app mobile se rafraîchit automatiquement quand vous sauvegardez

### Performance
- Activez la minification en production
- Optimisez les images
- Utilisez le cache HTTP

### Sécurité
- **IMPORTANT** : Gardez votre keystore en sécurité !
- Sauvegardez-le dans un endroit sûr
- Si vous le perdez, vous ne pourrez plus mettre à jour l'app

---

## 📞 Support

En cas de problème :
1. Vérifier les logs avec `adb logcat`
2. Inspecter dans Chrome DevTools
3. Vérifier la configuration réseau

**Note** : Le mode développement avec serveur local est idéal pour tester rapidement. 
Pour une vraie app production, déployez l'API sur un serveur distant.



