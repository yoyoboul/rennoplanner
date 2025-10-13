#!/usr/bin/env node

/**
 * Script de vérification pré-déploiement
 * Vérifie que tout est prêt pour Vercel + MongoDB
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark(condition, message) {
  if (condition) {
    log(`✅ ${message}`, 'green');
    return true;
  } else {
    log(`❌ ${message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🔍 VÉRIFICATION PRÉ-DÉPLOIEMENT VERCEL + MONGODB\n', 'blue');
  
  let allGood = true;

  // 1. Vérifier les variables d'environnement
  log('1️⃣  Variables d\'environnement', 'yellow');
  allGood &= checkmark(
    process.env.MONGODB_URI,
    'MONGODB_URI est définie'
  );
  allGood &= checkmark(
    process.env.MONGODB_URI?.includes('mongodb+srv://'),
    'MONGODB_URI utilise le format correct'
  );
  allGood &= checkmark(
    process.env.OPENAI_API_KEY,
    'OPENAI_API_KEY est définie'
  );
  allGood &= checkmark(
    process.env.OPENAI_API_KEY?.startsWith('sk-'),
    'OPENAI_API_KEY a le bon format'
  );

  // 2. Vérifier la connexion MongoDB
  log('\n2️⃣  Connexion MongoDB', 'yellow');
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('renoplanner');
    await db.command({ ping: 1 });
    log('✅ Connexion MongoDB réussie', 'green');
    
    // Vérifier les collections
    const collections = await db.listCollections().toArray();
    log(`   📂 Collections trouvées: ${collections.map(c => c.name).join(', ') || 'Aucune (base vide)'}`, 'blue');
    
    await client.close();
    allGood &= true;
  } catch (error) {
    log(`❌ Erreur connexion MongoDB: ${error.message}`, 'red');
    allGood = false;
  }

  // 3. Vérifier les fichiers essentiels
  log('\n3️⃣  Fichiers essentiels', 'yellow');
  const requiredFiles = [
    'lib/mongodb.ts',
    'lib/db-mongo.ts',
    'lib/types-mongo.ts',
    'lib/ai-tools-mongo.ts',
    'next.config.ts',
    'package.json',
    '.env.local',
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    allGood &= checkmark(exists, `${file} existe`);
  }

  // 4. Vérifier package.json
  log('\n4️⃣  Dépendances', 'yellow');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  allGood &= checkmark(
    packageJson.dependencies.mongodb,
    'mongodb est installé'
  );
  allGood &= checkmark(
    packageJson.dependencies.openai,
    'openai est installé'
  );

  // 5. Vérifier next.config.ts
  log('\n5️⃣  Configuration Next.js', 'yellow');
  const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
  const hasImages = nextConfig.includes('images:');
  const hasUnoptimized = nextConfig.includes('unoptimized: true');
  allGood &= checkmark(
    hasImages && hasUnoptimized,
    'Configuration images.unoptimized: true'
  );

  // 6. Vérifier capacitor.config.ts
  log('\n6️⃣  Configuration Capacitor', 'yellow');
  if (fs.existsSync('capacitor.config.ts')) {
    const capacitorConfig = fs.readFileSync('capacitor.config.ts', 'utf8');
    const hasServer = capacitorConfig.includes('server:');
    const hasUrl = capacitorConfig.includes('url:');
    
    if (hasServer && hasUrl) {
      log('✅ Configuration serveur présente', 'green');
      
      // Vérifier si c'est localhost ou Vercel
      if (capacitorConfig.includes('localhost') || capacitorConfig.includes('192.168')) {
        log('⚠️  L\'URL pointe vers localhost/IP locale (OK pour dev)', 'yellow');
        log('   💡 Après déploiement Vercel, mettez à jour avec l\'URL Vercel', 'blue');
      } else {
        log('✅ URL configurée (probablement Vercel)', 'green');
      }
    } else {
      log('❌ Configuration serveur manquante dans capacitor.config.ts', 'red');
      allGood = false;
    }
  } else {
    log('⚠️  capacitor.config.ts non trouvé (OK si pas d\'app mobile)', 'yellow');
  }

  // 7. Test de build (simulé)
  log('\n7️⃣  Build', 'yellow');
  log('💡 Pour tester le build complet, lancez: npm run build', 'blue');

  // Résumé final
  log('\n' + '='.repeat(60), 'blue');
  if (allGood) {
    log('\n🎉 TOUT EST PRÊT POUR LE DÉPLOIEMENT !', 'green');
    log('\nProchaines étapes:', 'blue');
    log('1. Lisez le guide: GUIDE-DEPLOIEMENT-VERCEL-MONGODB.md');
    log('2. Créez un compte sur vercel.com');
    log('3. Pushez votre code sur GitHub');
    log('4. Importez le projet dans Vercel');
    log('5. Configurez les variables d\'environnement dans Vercel');
    log('6. Déployez !');
  } else {
    log('\n⚠️  QUELQUES PROBLÈMES DÉTECTÉS', 'yellow');
    log('\nCorrigez les erreurs ci-dessus avant de déployer.', 'red');
  }
  log('\n' + '='.repeat(60) + '\n', 'blue');
}

main().catch(console.error);
