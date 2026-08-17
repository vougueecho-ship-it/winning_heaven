let unlocked = false;
let sharedCtx = null;
let activeAudio = null;
let lastPlayAt = 0;
const PLAY_COOLDOWN_MS = 1500;
const audioBufferCache = new Map();

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      sharedCtx = new Ctx();
    }
  }
  return sharedCtx;
}

// Browsers block audio until the user interacts with the page.
// Prime both Web Audio API and HTML5 Audio subsystem on the first user gesture.
export function initAudioUnlock() {
  if (typeof window === 'undefined' || unlocked) return;

  const unlock = () => {
    try {
      const ctx = getCtx();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (_) {
      // ignore unlock errors
    }

    try {
      // Also unlock HTML5 Audio element with a tiny silent data URI
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silentAudio.volume = 0.01;
      const p = silentAudio.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => {});
      }
    } catch (_) {
      // ignore
    }

    unlocked = true;
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('click', unlock);
  };

  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('click', unlock, { once: true, passive: true });
}

function playSynth() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const playTone = (freq, startTime, duration, vol = 0.16) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Elegant Casino Chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
    playTone(523.25, now, 0.12, 0.14);
    playTone(659.25, now + 0.07, 0.15, 0.16);
    playTone(783.99, now + 0.14, 0.18, 0.17);
    playTone(1046.50, now + 0.21, 0.35, 0.20);
  } catch (_) {
    // ignore synth errors
  }
}

function stopActiveAudio() {
  if (!activeAudio) return;
  try {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  } catch (_) {
    // ignore
  }
  activeAudio = null;
}

/**
 * Preload and decode audio into Web Audio memory buffer for 0ms latency alerts.
 */
async function getOrDecodeAudioBuffer(url) {
  if (!url) return null;
  if (audioBufferCache.has(url)) return audioBufferCache.get(url);

  const ctx = getCtx();
  if (!ctx) return null;

  try {
    let arrayBuffer = null;
    if (url.startsWith('data:')) {
      const commaIdx = url.indexOf(',');
      if (commaIdx !== -1) {
        const base64 = url.slice(commaIdx + 1);
        const binaryStr = atob(base64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      }
    } else {
      const res = await fetch(url);
      if (res.ok) {
        arrayBuffer = await res.arrayBuffer();
      }
    }

    if (arrayBuffer) {
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      if (decoded) {
        audioBufferCache.set(url, decoded);
        return decoded;
      }
    }
  } catch (_) {
    // ignore decode error, will fall back to HTMLAudio or synth
  }
  return null;
}

/**
 * Play alert sound once. Rapid repeat calls within cooldown are ignored.
 */
export function playNotificationSound(customUrl) {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  if (now - lastPlayAt < PLAY_COOLDOWN_MS) return false;
  lastPlayAt = now;

  try {
    stopActiveAudio();
    const ctx = getCtx();

    if (customUrl) {
      const cleanUrl = String(customUrl).replace(/^data:video\/[^;]+;/, 'data:audio/mpeg;');

      // 1. If we have a cached decoded buffer, play via Web Audio API (most reliable)
      if (ctx && audioBufferCache.has(cleanUrl)) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const buffer = audioBufferCache.get(cleanUrl);
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.8, ctx.currentTime);
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        return true;
      }

      // 2. Play via HTML5 Audio element
      const audio = new Audio(cleanUrl);
      audio.preload = 'auto';
      activeAudio = audio;
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            // Also cache buffer in background for next time
            getOrDecodeAudioBuffer(cleanUrl).catch(() => {});
          })
          .catch(() => {
            if (activeAudio === audio) activeAudio = null;
            playSynth();
          });
      }

      audio.onended = () => {
        if (activeAudio === audio) activeAudio = null;
      };

      // Also trigger buffer decode in background
      getOrDecodeAudioBuffer(cleanUrl).catch(() => {});
      return true;
    }

    playSynth();
    return true;
  } catch (_) {
    playSynth();
    return true;
  }
}

