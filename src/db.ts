import { openDB, type IDBPDatabase } from 'idb';

const dbName = 'AppStoreDB';
const dbVersion = 5;

export interface App {
  id?: number;
  name: string;
  description: string;
  file: Blob;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  ownerId: string;
  category: 'Games' | 'Tools' | 'Music' | 'Images' | 'Videos' | 'Other';
  icon?: Blob;
  iconType?: string;
}

export const CATEGORIES = ['Games', 'Tools', 'Music', 'Images', 'Videos', 'Other'] as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(dbName, dbVersion, {
      upgrade(database, oldVersion, newVersion, transaction) {
        if (!database.objectStoreNames.contains('apps')) {
          const store = database.createObjectStore('apps', { keyPath: 'id', autoIncrement: true });
          store.createIndex('uploadDate', 'uploadDate');
          store.createIndex('ownerId', 'ownerId');
          store.createIndex('category', 'category');
        }

        // Add icon support in version 5
        if (oldVersion < 5 && database.objectStoreNames.contains('apps')) {
          const store = transaction.objectStore('apps');
          if (!store.indexNames.contains('category')) {
            store.createIndex('category', 'category');
          }
        }
      },
      blocked() {
        console.warn('Database blocked. Please close other tabs and reload.');
      },
      blocking() {
        dbPromise = null;
      },
      terminated() {
        dbPromise = null;
      }
    });
  }
  return dbPromise;
};

const getDB = async () => {
  try {
    return await initDB();
  } catch (error) {
    console.error('Failed to get database:', error);
    dbPromise = null;
    throw error;
  }
};

export const addApp = async (app: App): Promise<number> => {
  try {
    const db = await getDB();
    return await db.add('apps', {
      ...app,
      uploadDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding app:', error);
    throw error;
  }
};

export const getAllApps = async (): Promise<App[]> => {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('apps', 'uploadDate');
  } catch (error) {
    console.error('Error getting all apps:', error);
    throw error;
  }
};

export const getAppsByCategory = async (category: App['category']): Promise<App[]> => {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('apps', 'category', category);
  } catch (error) {
    console.error('Error getting apps by category:', error);
    throw error;
  }
};

export const deleteApp = async (id: number): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete('apps', id);
  } catch (error) {
    console.error('Error deleting app:', error);
    throw error;
  }
};