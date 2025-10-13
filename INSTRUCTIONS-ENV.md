# 🔐 Instructions pour créer le fichier .env.local

## ⚠️ IMPORTANT : Action Requise

Vous devez créer **manuellement** un fichier nommé `.env.local` à la racine de votre projet.

## 📝 Étapes

### 1. Créer le fichier

**Dans le dossier `c:\Users\Yoanb\rennoplanner\rennoplanner\`**, créez un fichier nommé exactement :

```
.env.local
```

### 2. Copier ce contenu dans le fichier

```env
# ==========================================
# BASE DE DONNÉES MONGODB
# ==========================================

# IMPORTANT: Remplacez <db_password> par votre vrai mot de passe MongoDB
MONGODB_URI=mongodb+srv://yoanblgr_db_user:<db_password>@rennoplanner.yodgdjd.mongodb.net/?retryWrites=true&w=majority&appName=rennoplanner

# ==========================================
# INTELLIGENCE ARTIFICIELLE
# ==========================================

# Clé API OpenAI (requise pour l'assistant IA)
# Obtenez votre clé sur: https://platform.openai.com/api-keys
OPENAI_API_KEY=votre_clé_openai_ici
```

### 3. Remplacer les valeurs

#### MongoDB Password

Dans la ligne `MONGODB_URI`, remplacez `<db_password>` par votre **vrai mot de passe** MongoDB.

**Exemple :**
```env
# AVANT
MONGODB_URI=mongodb+srv://yoanblgr_db_user:<db_password>@rennoplanner...

# APRÈS (exemple avec le mot de passe "MonMotDePasse123")
MONGODB_URI=mongodb+srv://yoanblgr_db_user:MonMotDePasse123@rennoplanner...
```

⚠️ **Attention :** Si votre mot de passe contient des caractères spéciaux (`@`, `:`, `/`, `?`, `#`, `[`, `]`, etc.), vous devez les encoder en URL :

| Caractère | Encodé |
|-----------|--------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |
| `#` | `%23` |

**Outil pour encoder :** https://www.urlencoder.org/

#### OpenAI API Key

1. Connectez-vous sur [OpenAI](https://platform.openai.com/)
2. Allez sur [API Keys](https://platform.openai.com/api-keys)
3. Créez une nouvelle clé (ou utilisez une existante)
4. Copiez la clé (elle commence par `sk-proj-...` ou `sk-...`)
5. Collez-la dans votre `.env.local` :

```env
OPENAI_API_KEY=sk-proj-votre_vraie_clé_ici
```

### 4. Enregistrer le fichier

**Assurez-vous que :**
- Le fichier s'appelle exactement `.env.local` (pas `.env.local.txt`)
- Il est à la racine du projet (au même niveau que `package.json`)
- Les valeurs sont remplies (pas de `<db_password>` ou `votre_clé_openai_ici`)

### 5. Redémarrer le serveur

Une fois le fichier créé et sauvegardé :

1. Arrêtez le serveur Next.js (Ctrl+C dans le terminal)
2. Relancez-le :
   ```bash
   npm run dev
   ```

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Ouvrez [http://localhost:3000](http://localhost:3000)
2. Créez un nouveau projet
3. Ouvrez l'assistant IA
4. Envoyez un message de test

Si tout fonctionne, l'erreur 405 a disparu ! 🎉

## ❌ En cas de problème

### Erreur : "MongoDB non configuré"

- Vérifiez que le fichier `.env.local` existe
- Vérifiez que `MONGODB_URI` est bien défini et non vide
- Vérifiez que le mot de passe est correct

### Erreur : "Unauthorized MongoDB"

- Votre mot de passe est incorrect
- Vérifiez les caractères spéciaux (encodage URL)
- Vérifiez que l'utilisateur `yoanblgr_db_user` a les bons droits

### Erreur : "OpenAI API key not found"

- Vérifiez que `OPENAI_API_KEY` est défini dans `.env.local`
- Vérifiez que la clé est valide
- Redémarrez le serveur

## 📚 Ressources

- [MongoDB Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [URL Encoder](https://www.urlencoder.org/)
- [OpenAI API Keys](https://platform.openai.com/api-keys)

---

**Une fois configuré, tout devrait fonctionner parfaitement !** 🚀

