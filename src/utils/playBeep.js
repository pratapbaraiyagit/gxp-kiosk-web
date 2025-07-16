import beep from "../assets/sound/beep.wav";
import success from "../assets/sound/success.mp3";

export const playBeep = () => {
  const audio = new Audio(beep);
  audio.play();
};

export const playSuccess = () => {
  const audio = new Audio(success);
  audio.play();
};
