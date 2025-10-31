// lib/mongodb.ts

import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {};

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// MongoClient instance
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // Prevent multiple connections during HMR
  if (!(global as { _mongoClientPromise?: Promise<MongoClient> })._mongoClientPromise) {
    client = new MongoClient(uri, options);
    (global as { _mongoClientPromise?: Promise<MongoClient> })._mongoClientPromise = client.connect();
  }
  clientPromise = (global as { _mongoClientPromise?: Promise<MongoClient> })._mongoClientPromise!;
} else {
  // Production
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// ✅ Export the connected client promise
export { clientPromise };

// ✅ Export a centralized DB promise for "pdf-project"
export const dbPromise: Promise<Db> = clientPromise.then(client => client.db('pdf-project'));


