import {
  logo,
  Biglogo,
  Smallogo,
  TimeIcon,
  WeatherIcon,
  CheckInIcon,
  CheckOutIcon,
  WalkinIcon,
  FranceFlag,
  SpanishFlag,
  UKFlagIcon,
  JapanFlag,
  ArabFlag,
  Hotel,
  WhiteGxpLogo,
  WhiteMctLogo,
  RefreshIcon,
  HomeIcon,
  LicenseImg,
  refrenceCode,
  roomNumber,
  RightLogoIcon,
  FrontviewIcon,
  BackviewIcon,
  AccountIcon,
  LateCheckoutIcon,
  PettIcon,
  SmokingIcon,
  AccessibleIcon,
  Line,
  CheckIcon,
  Available,
  Booked,
  Selected,
  CreditCard,
  CashIcon,
  calenderIcon,
  OurHotel,
  FireSafetyImg,
  ACImg,
  ChargingImg,
  MiniBarImg,
  CarbonSafetyImg,
  IronImg,
  LaundryImg,
  AccessibilityImg,
  NearbyPlace1,
  NearbyPlace2,
  NearbyPlace3,
  NearbyPlace4,
  NearbyPlace5,
  FloorMap,
  ScannerFrontVideo,
  ScannerBackVideo,
  CashGif,
  CashCollect,
  CashPayout,
  CardInsertGif,
  Proccess,
  SplashBackground,
  AsianWoman,
  FeedbackIcon,
} from "../assets/image/Image";

import { convertImageToBase64 } from "./imageUtils";
import {
  storeImageInIndexedDb,
  getImageFromIndexedDb,
  checkImagesStored,
  markImagesAsStored,
} from "./indexedDbUtils";

// Function to convert video to ArrayBuffer for storage
export const convertVideoToArrayBuffer = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    throw error;
  }
};

// Function to store video in IndexedDB
export const storeVideoInIndexedDb = async (key, videoData) => {
  // This assumes your indexedDbUtils has similar functionality
  // as storeImageInIndexedDb but handles videos
  return storeImageInIndexedDb(key, videoData, "video");
};

// Retrieve video from IndexedDB and convert to URL
export const getVideoFromIndexedDb = async (key) => {
  try {
    const videoData = await getImageFromIndexedDb(key);
    if (!videoData) return null;

    // For videos stored as ArrayBuffer
    if (videoData instanceof ArrayBuffer) {
      const blob = new Blob([videoData], { type: "video/mp4" });
      return URL.createObjectURL(blob);
    }

    // If somehow stored as base64 string
    if (typeof videoData === "string" && videoData.startsWith("data:video")) {
      return videoData;
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Map all images and videos to their names for easier storage and retrieval
const allImages = {
  logo,
  Biglogo,
  Smallogo,
  TimeIcon,
  WeatherIcon,
  CheckInIcon,
  CheckOutIcon,
  WalkinIcon,
  FranceFlag,
  SpanishFlag,
  UKFlagIcon,
  JapanFlag,
  ArabFlag,
  Hotel,
  WhiteGxpLogo,
  WhiteMctLogo,
  RefreshIcon,
  HomeIcon,
  LicenseImg,
  refrenceCode,
  roomNumber,
  RightLogoIcon,
  FrontviewIcon,
  BackviewIcon,
  AccountIcon,
  LateCheckoutIcon,
  PettIcon,
  SmokingIcon,
  AccessibleIcon,
  Line,
  CheckIcon,
  Available,
  Booked,
  Selected,
  CreditCard,
  CashIcon,
  CashGif,
  CashCollect,
  CashPayout,
  CardInsertGif,
  Proccess,
  calenderIcon,
  OurHotel,
  FireSafetyImg,
  ACImg,
  ChargingImg,
  MiniBarImg,
  CarbonSafetyImg,
  IronImg,
  LaundryImg,
  AccessibilityImg,
  NearbyPlace1,
  NearbyPlace2,
  NearbyPlace3,
  NearbyPlace4,
  NearbyPlace5,
  FloorMap,
  SplashBackground,
  AsianWoman,
  FeedbackIcon,
};

// Separate object for videos
const allVideos = {
  ScannerFrontVideo,
  ScannerBackVideo,
};

// Cache for images and videos
const mediaCache = {};

// Store all images in IndexedDB
export const storeAllImages = async () => {
  try {
    // Check if we've already stored the media
    const mediaAlreadyStored = await checkImagesStored();
    if (mediaAlreadyStored) {
      return true;
    }

    // Convert and store each image
    for (const [name, src] of Object.entries(allImages)) {
      if (
        src &&
        typeof src === "string" &&
        (src.startsWith("http") || src.startsWith("/"))
      ) {
        try {
          const base64 = await convertImageToBase64(src);
          await storeImageInIndexedDb(`img_${name}`, base64);
        } catch (error) {
          // console.error(`Error converting ${name} to base64:`, error);
        }
      } else {
        // console.warn(`Skipping ${name} - not a valid image URL`);
      }
    }

    // Convert and store each video
    for (const [name, src] of Object.entries(allVideos)) {
      if (
        src &&
        typeof src === "string" &&
        (src.startsWith("http") || src.startsWith("/"))
      ) {
        try {
          const arrayBuffer = await convertVideoToArrayBuffer(src);
          await storeVideoInIndexedDb(`video_${name}`, arrayBuffer);
        } catch (error) {
          // console.error(
          //   `Error converting video ${name} to ArrayBuffer:`,
          //   error
          // );
        }
      } else {
        // console.warn(`Skipping video ${name} - not a valid video URL`);
      }
    }

    // Mark that we've stored the media
    await markImagesAsStored();
    return true;
  } catch (error) {
    return false;
  }
};

// Preload images and videos into cache
export const preloadMedia = async () => {
  // Preload images
  for (const name of Object.keys(allImages)) {
    try {
      const storedImage = await getImageFromIndexedDb(`img_${name}`);
      if (storedImage) {
        mediaCache[name] = storedImage;
      } else {
        mediaCache[name] = allImages[name]; // Fallback to original
      }
    } catch (error) {
      mediaCache[name] = allImages[name]; // Fallback to original
    }
  }

  // Preload videos
  for (const name of Object.keys(allVideos)) {
    try {
      const storedVideo = await getVideoFromIndexedDb(`video_${name}`);
      if (storedVideo) {
        mediaCache[name] = storedVideo;
      } else {
        mediaCache[name] = allVideos[name]; // Fallback to original
      }
    } catch (error) {
      mediaCache[name] = allVideos[name]; // Fallback to original
    }
  }

  return true;
};

// Get media source from cache
export const getImageSrc = (name) => {
  // Remove "img_" prefix if it's already there
  const imageName = name.startsWith("img_") ? name.substring(4) : name;
  return mediaCache[imageName] || allImages[imageName] || "";
};

// Get video source from cache
export const getVideoSrc = (name) => {
  // Remove "video_" prefix if it's already there
  const videoName = name.startsWith("video_") ? name.substring(6) : name;
  return mediaCache[videoName] || allVideos[videoName] || "";
};

// Initialize all media storage
export const initializeMediaStorage = async () => {
  await storeAllImages(); // This now stores both images and videos
  return preloadMedia();
};

// Keep the old function name for backward compatibility
export const initializeImageStorage = initializeMediaStorage;
