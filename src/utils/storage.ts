import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Document } from '../types';

const STORAGE_KEY = 'docscan_documents';

export async function loadDocuments(): Promise<Document[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const docs = JSON.parse(data) as Document[];
      return docs.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return [];
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

export async function saveDocuments(documents: Document[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error('Error saving documents:', error);
  }
}

export async function deleteAllDocuments(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error deleting documents:', error);
  }
}
