import { openDB } from 'idb';

const DB_NAME = 'KioskAudioDB';
const STORE_NAME = 'audios';

export const initDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const saveAudioBlob = async (id, url) => {
  try {
    const db = await initDB();
    const response = await fetch(url);
    const blob = await response.blob();

    await db.put(STORE_NAME, blob, id);
    console.log(`Stored audio for ID: ${id}`);
  } catch (error) {
    console.error(`Failed to save audio for ${id}:`, error);
  }
};

export const getAudioBlob = async (id) => {
  const db = await initDB();
  return await db.get(STORE_NAME, id); // returns Blob or undefined
};
