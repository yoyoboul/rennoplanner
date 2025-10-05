#!/bin/bash

echo "🔍 Vérification de l'installation mobile..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "✓ Node.js: "
if command -v node &> /dev/null; then
    echo -e "${GREEN}$(node --version)${NC}"
else
    echo -e "${RED}Non installé${NC}"
fi

# Check npm
echo -n "✓ npm: "
if command -v npm &> /dev/null; then
    echo -e "${GREEN}$(npm --version)${NC}"
else
    echo -e "${RED}Non installé${NC}"
fi

# Check Java
echo -n "✓ Java JDK: "
if command -v java &> /dev/null; then
    echo -e "${GREEN}$(java --version 2>&1 | head -n 1)${NC}"
else
    echo -e "${RED}Non installé${NC}"
fi

# Check Android Studio / adb
echo -n "✓ Android SDK (adb): "
if command -v adb &> /dev/null; then
    echo -e "${GREEN}$(adb --version | head -n 1)${NC}"
else
    echo -e "${YELLOW}Non trouvé dans PATH${NC}"
    echo "  → Installer Android Studio: https://developer.android.com/studio"
fi

# Check Capacitor
echo -n "✓ Capacitor: "
if [ -f "node_modules/@capacitor/core/package.json" ]; then
    version=$(cat node_modules/@capacitor/core/package.json | grep '"version"' | head -1 | awk -F\" '{print $4}')
    echo -e "${GREEN}$version${NC}"
else
    echo -e "${RED}Non installé${NC}"
    echo "  → Exécuter: npm install"
fi

# Check Android folder
echo -n "✓ Projet Android: "
if [ -d "android" ]; then
    echo -e "${GREEN}Créé${NC}"
else
    echo -e "${RED}Pas encore créé${NC}"
    echo "  → Exécuter: npm run mobile:add:android"
fi

# Check capacitor.config.ts
echo -n "✓ Configuration: "
if [ -f "capacitor.config.ts" ]; then
    echo -e "${GREEN}capacitor.config.ts existe${NC}"
else
    echo -e "${RED}capacitor.config.ts manquant${NC}"
fi

echo ""
echo "─────────────────────────────────────────"
echo ""

# Summary
if [ -d "android" ] && [ -f "capacitor.config.ts" ]; then
    echo -e "${GREEN}✅ Installation mobile complète !${NC}"
    echo ""
    echo "Pour lancer l'app:"
    echo "  1. Terminal 1: npm run dev"
    echo "  2. Terminal 2: npm run mobile:open"
    echo "  3. Dans Android Studio: cliquer sur ▶️"
else
    echo -e "${YELLOW}⚠️  Configuration incomplète${NC}"
    echo ""
    echo "Pour terminer l'installation:"
    if [ ! -d "android" ]; then
        echo "  1. npm run mobile:add:android"
    fi
fi

echo ""
echo "📚 Documentation:"
echo "  • Démarrage rapide: DEMARRAGE-RAPIDE-MOBILE.md"
echo "  • Build complet: MOBILE-BUILD.md"
echo "  • Récapitulatif: RECAP-MOBILE.md"
echo ""



