#!/usr/bin/env node

/**
 * Script de migration SQLite → MongoDB
 * Migre le projet "13 rue du 27 Juin" avec toutes ses données
 */

const Database = require('better-sqlite3');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement depuis .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

// Configuration
const SQLITE_DB_PATH = path.join(__dirname, '../reno-planner.db');
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Erreur : MONGODB_URI non défini dans .env.local');
  console.error('   Créez un fichier .env.local avec votre URI MongoDB');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Début de la migration SQLite → MongoDB\n');

  // Connexion SQLite
  console.log('📂 Connexion à SQLite...');
  const sqlite = new Database(SQLITE_DB_PATH, { readonly: true });

  // Connexion MongoDB
  console.log('🌍 Connexion à MongoDB...');
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const db = mongoClient.db();

  try {
    // 1. Migrer le projet
    console.log('\n📋 Migration du projet...');
    const project = sqlite.prepare(`
      SELECT * FROM projects WHERE id = 1
    `).get();

    if (!project) {
      console.error('❌ Projet non trouvé dans SQLite');
      process.exit(1);
    }

    const projectId = new ObjectId();
    const projectDoc = {
      _id: projectId,
      name: project.name,
      description: project.description || undefined,
      total_budget: project.total_budget || undefined,
      created_at: new Date(project.created_at),
      updated_at: new Date(project.updated_at),
    };

    await db.collection('projects').insertOne(projectDoc);
    console.log(`✅ Projet migré : "${project.name}" (ID: ${projectId})`);

    // 2. Migrer les pièces
    console.log('\n🏠 Migration des pièces...');
    const rooms = sqlite.prepare(`
      SELECT * FROM rooms WHERE project_id = 1
    `).all();

    const roomIdMap = new Map(); // SQLite ID → MongoDB ObjectId

    for (const room of rooms) {
      const roomId = new ObjectId();
      roomIdMap.set(room.id, roomId);

      const roomDoc = {
        _id: roomId,
        project_id: projectId,
        name: room.name,
        description: room.description || undefined,
        surface_area: room.surface_area || undefined,
        allocated_budget: room.allocated_budget || undefined,
        created_at: new Date(room.created_at),
      };

      await db.collection('rooms').insertOne(roomDoc);
      console.log(`   ✅ Pièce : "${room.name}"`);
    }

    console.log(`✅ ${rooms.length} pièces migrées`);

    // 3. Migrer les tâches
    console.log('\n📝 Migration des tâches...');
    const tasks = sqlite.prepare(`
      SELECT * FROM tasks WHERE room_id IN (
        SELECT id FROM rooms WHERE project_id = 1
      )
    `).all();

    const taskIdMap = new Map(); // SQLite ID → MongoDB ObjectId

    for (const task of tasks) {
      const taskId = new ObjectId();
      taskIdMap.set(task.id, taskId);

      const mongoRoomId = roomIdMap.get(task.room_id);
      if (!mongoRoomId) {
        console.warn(`   ⚠️  Pièce introuvable pour la tâche "${task.title}"`);
        continue;
      }

      const taskDoc = {
        _id: taskId,
        room_id: mongoRoomId,
        title: task.title,
        description: task.description || undefined,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        category: task.category,
        estimated_cost: task.estimated_cost || undefined,
        actual_cost: task.actual_cost || undefined,
        estimated_duration: task.estimated_duration || undefined,
        actual_duration: task.actual_duration || undefined,
        start_date: task.start_date ? new Date(task.start_date) : undefined,
        end_date: task.end_date ? new Date(task.end_date) : undefined,
        dependencies: task.dependencies ? JSON.parse(task.dependencies).map(id => {
          const mongoTaskId = taskIdMap.get(parseInt(id));
          return mongoTaskId || new ObjectId(id);
        }) : undefined,
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at),
      };

      await db.collection('tasks').insertOne(taskDoc);
      console.log(`   ✅ Tâche : "${task.title}" (${task.status})`);
    }

    console.log(`✅ ${tasks.length} tâches migrées`);

    // 4. Migrer les achats
    console.log('\n🛒 Migration des achats...');
    const purchases = sqlite.prepare(`
      SELECT * FROM purchases WHERE project_id = 1
    `).all();

    for (const purchase of purchases) {
      const purchaseId = new ObjectId();
      const mongoRoomId = purchase.room_id ? roomIdMap.get(purchase.room_id) : undefined;
      const mongoTaskId = purchase.task_id ? taskIdMap.get(purchase.task_id) : undefined;

      const purchaseDoc = {
        _id: purchaseId,
        project_id: projectId,
        room_id: mongoRoomId,
        task_id: mongoTaskId,
        name: purchase.item_name,
        description: purchase.description || undefined,
        quantity: purchase.quantity,
        unit_price: purchase.unit_price,
        total_price: purchase.total_price,
        category: purchase.category || undefined,
        item_type: purchase.item_type || 'materiaux',
        supplier: purchase.supplier || undefined,
        purchase_date: purchase.purchase_date ? new Date(purchase.purchase_date) : undefined,
        status: purchase.status || 'planned',
        notes: purchase.notes || undefined,
        created_at: new Date(purchase.created_at),
        updated_at: new Date(purchase.updated_at),
      };

      await db.collection('purchases').insertOne(purchaseDoc);
      console.log(`   ✅ Achat : "${purchase.item_name}" (${purchase.quantity}x ${purchase.unit_price}€)`);
    }

    console.log(`✅ ${purchases.length} achats migrés`);

    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration terminée avec succès !');
    console.log('='.repeat(60));
    console.log(`
📊 Résumé :
   • Projet    : ${project.name}
   • Pièces    : ${rooms.length}
   • Tâches    : ${tasks.length}
   • Achats    : ${purchases.length}
   • MongoDB ID: ${projectId}

🎉 Toutes les données ont été importées dans MongoDB.
   Vous pouvez maintenant accéder à votre projet depuis l'app mobile !
`);

  } catch (error) {
    console.error('\n❌ Erreur durant la migration :', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    sqlite.close();
    await mongoClient.close();
  }
}

// Exécuter la migration
migrate().catch(console.error);

