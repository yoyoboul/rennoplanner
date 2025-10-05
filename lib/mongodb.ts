import { MongoClient, Db, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Initialiser MongoDB seulement si MONGODB_URI est défini
if (uri) {
  if (process.env.NODE_ENV === 'development') {
    // En développement, utiliser une variable globale pour conserver la connexion
    // durant les rechargements de modules (hot reload)
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // En production, créer une nouvelle connexion
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  console.warn('⚠️ MONGODB_URI non défini - MongoDB non disponible');
}

export { clientPromise };

// Helper pour obtenir la base de données
export async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    throw new Error('⚠️ MongoDB non configuré. Veuillez définir MONGODB_URI dans .env.local');
  }
  const client = await clientPromise;
  return client.db('renoplanner');
}

// Helper pour convertir ObjectId
export function toObjectId(id: string | number): ObjectId {
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  // Pour compatibilité avec les anciens IDs numériques
  return new ObjectId();
}

// Helper pour extraire l'ID
export function fromObjectId(objectId: ObjectId | string): string {
  return objectId.toString();
}

