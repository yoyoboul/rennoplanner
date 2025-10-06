#!/bin/bash

# 📱 Script de Rebuild Mobile - Reno Planner
# Usage: ./rebuild-mobile.sh

echo "🚀 Rebuild Mobile - Reno Planner"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Étape 1: Vérifier l'IP locale
echo "📡 Étape 1/5: Détection de votre IP locale..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0)
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1)
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
else
    # Windows (Git Bash)
    IP=$(ipconfig | grep -A 1 "Wireless LAN adapter Wi-Fi" | grep "IPv4" | awk '{print $NF}')
fi

if [ -z "$IP" ]; then
    echo -e "${RED}❌ Impossible de détecter l'IP locale${NC}"
    echo "Veuillez la trouver manuellement:"
    echo "  Mac:     ipconfig getifaddr en0"
    echo "  Linux:   hostname -I"
    echo "  Windows: ipconfig"
    echo ""
    echo "Puis mettez à jour capacitor.config.ts ligne 13"
    exit 1
fi

echo -e "${GREEN}✅ IP détectée: $IP${NC}"
echo ""

# Étape 2: Vérifier si l'IP est à jour dans capacitor.config.ts
echo "📝 Étape 2/5: Vérification de capacitor.config.ts..."
CURRENT_IP=$(grep "url:" capacitor.config.ts | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')

if [ "$CURRENT_IP" != "$IP" ]; then
    echo -e "${YELLOW}⚠️  L'IP dans capacitor.config.ts est différente${NC}"
    echo "   Actuelle: $CURRENT_IP"
    echo "   Détectée: $IP"
    echo ""
    read -p "Voulez-vous mettre à jour automatiquement? (o/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        # Backup
        cp capacitor.config.ts capacitor.config.ts.backup
        # Replace IP
        sed -i.bak "s|http://.*:3000|http://$IP:3000|g" capacitor.config.ts
        rm capacitor.config.ts.bak
        echo -e "${GREEN}✅ IP mise à jour dans capacitor.config.ts${NC}"
    else
        echo -e "${YELLOW}⚠️  Veuillez mettre à jour l'IP manuellement${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ IP à jour: $IP${NC}"
fi
echo ""

# Étape 3: Nettoyer et builder
echo "🧹 Étape 3/5: Nettoyage et build..."
echo "   - Suppression des anciens builds..."
npm run mobile:clean > /dev/null 2>&1

echo "   - Build Next.js..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build Next.js${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build Next.js terminé${NC}"
echo ""

# Étape 4: Sync Capacitor
echo "🔄 Étape 4/5: Synchronisation Capacitor..."
npm run mobile:sync
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de la synchronisation Capacitor${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Synchronisation terminée${NC}"
echo ""

# Étape 5: Instructions finales
echo "📱 Étape 5/5: Prochaines étapes..."
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ BUILD PRÉPARÉ AVEC SUCCÈS                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "🔥 Pour continuer:"
echo ""
echo "1️⃣  TERMINAL 1 - Lancer le serveur (GARDER OUVERT):"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2️⃣  TERMINAL 2 - Builder l'APK:"
echo -e "   ${YELLOW}npm run mobile:open${NC}"
echo "   Puis dans Android Studio:"
echo "   Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo ""
echo "OU directement installer sur téléphone USB:"
echo "   Run > Run 'app' (Shift+F10)"
echo ""
echo "📍 Configuration réseau:"
echo "   Serveur: http://$IP:3000"
echo "   Assurez-vous que le téléphone est sur le même WiFi!"
echo ""
echo -e "${GREEN}🎉 Votre app mobile est prête!${NC}"
