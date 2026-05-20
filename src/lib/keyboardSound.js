import { getSoundBuffer } from "./audioPreloader";
import { SOUND_DEFINES_DOWN, SOUND_DEFINES_UP } from "../keyboard/sound";

let audioContext = null;
let audioBuffer = null;
let loadingPromise = null;

export function loadKeyboardSound() {
  if (loadingPromise) return loadingPromise;

  audioContext ||= new AudioContext();
  loadingPromise = getSoundBuffer()
    .then((buffer) => (buffer ? audioContext.decodeAudioData(buffer.slice(0)) : null))
    .then((decoded) => {
      audioBuffer = decoded;
      return decoded;
    })
    .catch(() => null);

  return loadingPromise;
}

export function playKeyboardSound(code, phase = "down", volume = 0.5) {
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  if (!audioBuffer) {
    void loadKeyboardSound();
    return;
  }

  const soundDef = phase === "down" ? SOUND_DEFINES_DOWN[code] : SOUND_DEFINES_UP[code];
  if (!soundDef) return;

  const [startMs, durationMs] = soundDef;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();

  source.buffer = audioBuffer;
  gain.gain.value = volume;
  source.connect(gain).connect(audioContext.destination);
  source.start(0, startMs / 1000, durationMs / 1000);
}
