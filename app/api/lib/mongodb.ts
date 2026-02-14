// lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// ── Index initialization (runs once on startup) ──────────────
async function initializeIndexes(db: Db): Promise<void> {
  try {
    await Promise.all([

      // ── analytics_logs ──────────────────────────────────────
      db.collection('analytics_logs').createIndex({ documentId: 1, viewerId: 1, action: 1 }),
      db.collection('analytics_logs').createIndex({ documentId: 1, email: 1 }),
      db.collection('analytics_logs').createIndex({ documentId: 1, action: 1, pageNumber: 1 }),
      db.collection('analytics_logs').createIndex({ timestamp: -1 }),

      // ── analytics_sessions ──────────────────────────────────
      db.collection('analytics_sessions').createIndex({ documentId: 1, viewerId: 1 }),
      db.collection('analytics_sessions').createIndex({ sessionId: 1 }, { unique: true }),
      db.collection('analytics_sessions').createIndex({ documentId: 1, startedAt: -1 }),

      // ── heatmap_events ──────────────────────────────────────
      db.collection('heatmap_events').createIndex({ documentId: 1, page: 1, type: 1 }),
      db.collection('heatmap_events').createIndex({ documentId: 1, viewerId: 1 }),

      // ── intent_signals ──────────────────────────────────────
      db.collection('intent_signals').createIndex({ documentId: 1, viewerId: 1 }),
      db.collection('intent_signals').createIndex({ documentId: 1, signal: 1 }),

      // ── viewer_presence (TTL — auto-deletes after 5 min) ────
      db.collection('viewer_presence').createIndex({ documentId: 1, lastPing: 1 }),
      db.collection('viewer_presence').createIndex(
        { lastPing: 1 },
        { expireAfterSeconds: 300 }
      ),

      // ── viewer_identities ───────────────────────────────────
      db.collection('viewer_identities').createIndex(
        { viewerId: 1, documentId: 1 },
        { unique: true }
      ),
      db.collection('viewer_identities').createIndex({ documentId: 1, intentScore: -1 }),

      // ── shares ──────────────────────────────────────────────
      db.collection('shares').createIndex({ shareToken: 1 }, { unique: true }),
      db.collection('shares').createIndex({ documentId: 1 }),
      db.collection('shares').createIndex({ userId: 1 }),

      // ── document_views ──────────────────────────────────────
      db.collection('document_views').createIndex({ documentId: 1, viewedAt: -1 }),
      db.collection('document_views').createIndex({ sessionId: 1 }),
      db.collection('document_views').createIndex({ documentId: 1, email: 1 }),

      // ── documents ───────────────────────────────────────────
      db.collection('documents').createIndex({ userId: 1, createdAt: -1 }),

      // ── signature_requests ──────────────────────────────────
      db.collection('signature_requests').createIndex({ documentId: 1 }),
      db.collection('signature_requests').createIndex({ uniqueId: 1 }, { unique: true }),

      // ── reminder_logs ───────────────────────────────────────
      db.collection('reminder_logs').createIndex({ documentId: 1 }),
      db.collection('reminder_logs').createIndex({ signatureRequestId: 1 }),

      // ── nda_acceptances ─────────────────────────────────────
      db.collection('nda_acceptances').createIndex({ documentId: 1, timestamp: -1 }),

    ]);
    console.log('✅ MongoDB indexes ready');
  } catch (error) {
    // Non-fatal — app still works, just slower queries
    console.error('⚠️ Index init error (non-fatal):', error);
  }
}

// ── Singleton client (prevents multiple connections in dev HMR) ─
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Track whether indexes have been initialized this process lifetime
let indexesInitialized = false;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoIndexesInitialized?: boolean;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }

  clientPromise = globalWithMongo._mongoClientPromise;
  indexesInitialized = globalWithMongo._mongoIndexesInitialized || false;

} else {
  // Production — single instance, no global needed
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// ── DB promise — the one import used across all your routes ────
export const dbPromise: Promise<Db> = clientPromise.then(c => {
  const db = c.db('pdf-project');

  // Only initialize indexes once per process
  if (!indexesInitialized) {
    indexesInitialized = true;

    if (process.env.NODE_ENV === 'development') {
      (global as typeof global & { _mongoIndexesInitialized?: boolean })
        ._mongoIndexesInitialized = true;
    }

    // Run in background — never blocks requests
    initializeIndexes(db).catch(console.error);
  }

  return db;
});

export { clientPromise };