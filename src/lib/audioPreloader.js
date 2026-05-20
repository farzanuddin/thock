const SOUND_URL = "/sounds/sound.ogg";

let cachedBuffer = null;
let fetchPromise = null;

function startFetch() {
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(SOUND_URL)
    .then((response) => (response.ok ? response.arrayBuffer() : null))
    .then((buffer) => {
      cachedBuffer = buffer;
      return buffer;
    })
    .catch(() => null);

  return fetchPromise;
}

if (typeof window !== "undefined") {
  startFetch();
}

export function getSoundBuffer() {
  if (cachedBuffer) return Promise.resolve(cachedBuffer);
  return startFetch();
}
