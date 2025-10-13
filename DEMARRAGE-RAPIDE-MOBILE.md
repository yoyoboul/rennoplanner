# 🚀 Démarrage Rapide - App Mobile Android

## ✅ Configuration terminée !

Votre projet est maintenant prêt pour créer une app Android. Voici comment procéder :

---

## 📱 Option 1 : Test rapide (Recommandé pour commencer)

### Étape 1 : Lancer le serveur API
```bash
npm run dev
```
✅ Le serveur doit tourner sur http://localhost:3000

### Étape 2 : Ouvrir Android Studio
```bash
npm run mobile:open
```
Cela ouvrira le projet Android dans Android Studio.

### Étape 3 : Lancer l'app
1. Attendez que Gradle finisse de synchroniser (barre de progression en bas)
2. Sélectionnez un émulateur Android (ou créez-en un)
3. Cliquez sur le bouton ▶️ "Run"

**🎉 L'app s'ouvre et communique avec votre serveur local !**

---

## 🔧 Vous n'avez pas Android Studio ?

### Installation rapide (Mac)
```bash
# 1. Télécharger Android Studio
open https://developer.android.com/studio

# 2. Installer et lancer Android Studio

# 3. Dans le wizard de setup :
# - Installer Android SDK (API 33 ou supérieur)
# - Installer Android SDK Platform-Tools
# - Installer Android SDK Build-Tools
# - Créer un émulateur Android (Pixel 6 recommandé)
```

---

## 📦 Option 2 : Générer l'APK pour installation

Si vous voulez installer l'app sur un vrai téléphone :

### Étape 1 : Ouvrir le projet
```bash
npm run mobile:open
```

### Étape 2 : Générer l'APK
Dans Android Studio :
1. Menu : **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Attendez la fin du build
3. Cliquez sur "locate" dans la notification
4. L'APK est dans : `android/app/build/outputs/apk/debug/app-debug.apk`

### Étape 3 : Installer sur votre téléphone

**Via câble USB** :
```bash
# Activer le débogage USB sur votre téléphone
# (Paramètres > Options développeur > Débogage USB)

# Connecter le téléphone et installer
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Via transfert de fichier** :
1. Copier `app-debug.apk` sur votre téléphone
2. Ouvrir le fichier avec un explorateur
3. Autoriser l'installation depuis des sources inconnues
4. Installer !

---

## ⚠️ Important : Configuration réseau

### Pour l'émulateur Android
✅ Déjà configuré ! L'app utilise `10.0.2.2:3000` qui pointe vers votre localhost.

### Pour un appareil physique (téléphone réel)

**Vous et votre téléphone doivent être sur le même WiFi !**

1. Trouvez votre IP locale :
```bash
# Sur Mac
ipconfig getifaddr en0

# Vous obtiendrez quelque chose comme : 192.168.1.10
```

2. Modifiez `capacitor.config.ts` :
```typescript
server: {
  url: 'http://192.168.1.10:3000',  // Remplacez par VOTRE IP
  cleartext: true,
}
```

3. Synchronisez :
```bash
npm run mobile:sync
```

4. Rebuild et installez l'APK

---

## 🐛 Résolution de problèmes

### "Unable to connect to server"
- ✅ Vérifiez que `npm run dev` tourne
- ✅ Pour émulateur : utilisez `10.0.2.2:3000`
- ✅ Pour téléphone réel : même WiFi + votre IP locale

### "cleartext traffic not permitted"
- ✅ Déjà configuré dans `android/app/src/main/AndroidManifest.xml`
- Si le problème persiste, ajoutez `android:usesCleartextTraffic="true"`

### Gradle sync failed
```bash
# Nettoyer et resynchro
cd android
./gradlew clean
cd ..
npm run mobile:sync
```

### L'app plante au démarrage
```bash
# Voir les logs
adb logcat | grep "Reno Planner"
```

---

## 🎨 Personnalisation

### Changer l'icône
1. Générer des icônes : https://icon.kitchen/
2. Remplacer dans `android/app/src/main/res/mipmap-*/`

### Changer le nom
- Modifier `appName` dans `capacitor.config.ts`
- Puis : `npm run mobile:sync`

---

## 📝 Prochaines étapes

Une fois que l'app fonctionne en développement :

1. **Déployer l'API** (Vercel gratuit) - Voir `MOBILE-BUILD.md`
2. **Générer un APK signé** pour production
3. **Publier sur Google Play Store** (optionnel)

---

## 💡 Astuces

**Développement rapide** :
- Modifiez votre code Next.js
- Sauvegardez
- L'app se rafraîchit automatiquement !

**Debugging** :
- Ouvrir Chrome : `chrome://inspect`
- Inspecter l'app comme un site web
- Utiliser les DevTools normalement

**Performance** :
- Le mode debug est plus lent
- Pour tester la vraie vitesse : build en mode release

---

## 📚 Documentation complète

Voir `MOBILE-BUILD.md` pour :
- Build de production
- Signature d'APK
- Publication Play Store
- Debugging avancé

---

**🎉 Félicitations ! Votre app mobile est prête !**

Des questions ? L'app ne fonctionne pas ? Vérifiez les logs avec :
```bash
adb logcat
```



