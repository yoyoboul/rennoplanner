// Script de test de connexion MongoDB
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI non défini dans .env.local');
    process.exit(1);
  }

  console.log('🔄 Tentative de connexion à MongoDB...');
  console.log('📍 URI:', uri.replace(/:[^:@]+@/, ':****@')); // Masque le password
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB réussie !');
    
    const db = client.db();
    console.log('📦 Base de données:', db.databaseName);
    
    // Liste les collections
    const collections = await db.listCollections().toArray();
    console.log('📂 Collections:', collections.length === 0 ? 'Aucune (base vide)' : collections.map(c => c.name).join(', '));
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

testConnection();

