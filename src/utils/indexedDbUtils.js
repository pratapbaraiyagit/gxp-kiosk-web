// utils/indexedDbUtils.js

import { notification } from "../helpers/middleware";

// Database configuration
const DB_NAME = "AppImageStore";
const DB_VERSION = 1;
const IMAGE_STORE = "images";

// Initialize the database
export const initIndexedDb = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle database upgrade (first time or version change)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create an object store for images if it doesn't exist
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// Store an image in IndexedDB
export const storeImageInIndexedDb = async (key, imageData) => {
  try {
    const db = await initIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE], "readwrite");
      const store = transaction.objectStore(IMAGE_STORE);

      const request = store.put({ key, data: imageData });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    return false;
  }
};

// Retrieve an image from IndexedDB
export const getImageFromIndexedDb = async (key) => {
  try {
    const db = await initIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE], "readonly");
      const store = transaction.objectStore(IMAGE_STORE);

      const request = store.get(key);

      request.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result ? result.data : null);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    return null;
  }
};

// Check if images have been stored in IndexedDB
export const checkImagesStored = async () => {
  try {
    const db = await initIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE], "readonly");
      const store = transaction.objectStore(IMAGE_STORE);

      // Use a special key to track initialization status
      const request = store.get("imagesStored");

      request.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result ? true : false);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    return false;
  }
};

// Mark that all images have been stored
export const markImagesAsStored = async () => {
  try {
    const db = await initIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE], "readwrite");
      const store = transaction.objectStore(IMAGE_STORE);

      const request = store.put({ key: "imagesStored", data: true });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    return false;
  }
};

// Clear all stored images
export const clearStoredImages = async () => {
  try {
    const db = await initIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE], "readwrite");
      const store = transaction.objectStore(IMAGE_STORE);

      const request = store.clear();

      request.onsuccess = () => {
        notification("Images cleared. Please log in again.", "warn");
        resolve(true);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    return false;
  }
};
