import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getSessionItem } from "../hooks/session";
import { getAudioBlob } from "./audioStorage";

dayjs.extend(utc);
dayjs.extend(timezone);

export const hasAccess = (userSession, roles) => {
  if (!userSession || !userSession?.user_type) return false;
  return roles?.includes(userSession.user_type);
};

export function isWithinOneHour(checkInTime) {
  if (checkInTime) {
    const currentTime = new Date();
    const [checkInHour, checkInMinute] = checkInTime?.split(":")?.map(Number);

    const checkInDate = new Date();
    checkInDate.setHours(checkInHour, checkInMinute, 0, 0);

    const timeDiff = checkInDate - currentTime;

    return timeDiff > 0 && timeDiff <= 60 * 60 * 1000;
  }
}

export function isWithinEarlyCheckIn(checkInTime, earlyCheckInTime, timeZone) {
  if (!checkInTime || !earlyCheckInTime || !timeZone) return false;

  const now = dayjs().tz(timeZone); // Current time in hotel's timezone
  const today = now.format("YYYY-MM-DD");

  const early = dayjs.tz(`${today} ${earlyCheckInTime}`, "YYYY-MM-DD HH:mm:ss", timeZone);
  const checkIn = dayjs.tz(`${today} ${checkInTime}`, "YYYY-MM-DD HH:mm:ss", timeZone);

  return now.isAfter(early) && now.isBefore(checkIn);
}

let currentAudio = null; // Global reference to currently playing audio

export async function playSafeAudio(prompt_name) {
  try {
    const kioskAudios = getSessionItem("kioskAudioDetails");
    if (!kioskAudios) {
      console.warn("No kiosk audio details found in session storage");
      return;
    }

    const kioskAudiosList = JSON.parse(kioskAudios);
    const audioItem = kioskAudiosList.find(item => item.prompt_name === prompt_name);

    if (!audioItem) {
      console.warn(`No audio found for prompt_name: ${prompt_name}`);
      return;
    }

    // Stop and reset previous audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    // Try to get audio from local IndexedDB
    const localBlob = await getAudioBlob(audioItem.id);
    let audioSource;

    if (localBlob) {
      // Use locally stored audio
      audioSource = URL.createObjectURL(localBlob);
    } else {
      // Fallback to server URL
      audioSource = audioItem.audio_url;
      console.warn("Using online audio URL (may expire):", prompt_name);
    }

    // Delay and play
    setTimeout(() => {
      currentAudio = new Audio(audioSource);
      currentAudio.play().catch((err) => {
        console.error("Failed to play audio:", err);
      });
    }, 500); // you can tweak this delay

  } catch (error) {
    console.error("Error playing audio:", error);
  }
}