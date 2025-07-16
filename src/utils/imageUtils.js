// utils/imageUtils.js
import { storeImageInIndexedDb, getImageFromIndexedDb } from "./indexedDbUtils";

// Function to convert an image URL to base64
export const convertImageToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = url;
  });
};

// Store image in IndexedDB
export const storeImageInLocalStorage = async (key, imageUrl) => {
  try {
    const base64Image = await convertImageToBase64(imageUrl);
    return await storeImageInIndexedDb(key, base64Image);
  } catch (error) {
    return false;
  }
};

// Get image from IndexedDB
export const getImageFromLocalStorage = async (key) => {
  return await getImageFromIndexedDb(key);
};
