const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkCollections() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB\n');
    
    // Vérifier la base "renoplanner"
    console.log('=== Base de données: renoplanner ===');
    const dbRenoplanner = client.db('renoplanner');
    const collectionsRenoplanner = await dbRenoplanner.listCollections().toArray();
    console.log('Collections:', collectionsRenoplanner.map(c => c.name).join(', ') || 'Aucune');
    
    for (const coll of ['projects', 'rooms', 'tasks', 'purchases']) {
      const count = await dbRenoplanner.collection(coll).countDocuments();
      console.log(`  - ${coll}: ${count} documents`);
    }
    
    // Vérifier la base "reno-planner"
    console.log('\n=== Base de données: reno-planner ===');
    const dbRenoPlanner = client.db('reno-planner');
    const collectionsRenoPlanner = await dbRenoPlanner.listCollections().toArray();
    console.log('Collections:', collectionsRenoPlanner.map(c => c.name).join(', ') || 'Aucune');
    
    for (const coll of ['projects', 'rooms', 'tasks', 'purchases']) {
      const count = await dbRenoPlanner.collection(coll).countDocuments();
      console.log(`  - ${coll}: ${count} documents`);
      
      if (count > 0) {
        // Afficher un exemple de document
        const sample = await dbRenoPlanner.collection(coll).findOne();
        console.log(`    Exemple d'ID: ${sample._id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
  }
}

checkCollections();
