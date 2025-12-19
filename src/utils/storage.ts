import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Document } from '../types';

interface ScannerDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
    indexes: { 'by-date': Date };
  };
}

const DB_NAME = 'scanner-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ScannerDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<ScannerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ScannerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('documents', { keyPath: 'id' });
        store.createIndex('by-date', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function loadDocuments(): Promise<Document[]> {
  try {
    const db = await getDB();
    const docs = await db.getAll('documents');
    return docs.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

export async function saveDocuments(documents: Document[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('documents', 'readwrite');

    // Clear and re-add all documents
    await tx.store.clear();
    for (const doc of documents) {
      await tx.store.put(doc);
    }

    await tx.done;
  } catch (error) {
    console.error('Error saving documents:', error);
  }
}

export async function saveDocument(document: Document): Promise<void> {
  try {
    const db = await getDB();
    await db.put('documents', document);
  } catch (error) {
    console.error('Error saving document:', error);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('documents', id);
  } catch (error) {
    console.error('Error deleting document:', error);
  }
}
