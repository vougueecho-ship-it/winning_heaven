/**
 * Device Fingerprinting & Identification Helper
 * Provides a persistent and hardware-correlated device ID across Web browsers and Native Capacitor mobile apps.
 */

let cachedDeviceId = null;

// Simple fast SHA-256 / DJB2 fallback hash
async function hashString(str) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Fallback hash
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : '';
}

function setCookie(name, value, days = 3650) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getOrSetPersistentUuid() {
  if (typeof window === 'undefined') return '';
  
  let uuid = '';
  try {
    uuid = localStorage.getItem('wh_device_uuid') || '';
  } catch {}

  if (!uuid) {
    uuid = getCookie('wh_device_uuid') || '';
  }

  if (!uuid) {
    // Generate secure random UUID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      uuid = crypto.randomUUID();
    } else {
      uuid = 'wh-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
    }
  }

  // Ensure stored in both places
  try {
    localStorage.setItem('wh_device_uuid', uuid);
  } catch {}
  setCookie('wh_device_uuid', uuid, 3650);

  return uuid;
}

function getCanvasFingerprint() {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', 'Helvetica', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('WinningHeaven,🎰💎⚡', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('WinningHeaven,🎰💎⚡', 4, 17);

    return canvas.toDataURL();
  } catch {
    return '';
  }
}

function getWebGLFingerprint() {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      return `${vendor}~${renderer}`;
    }
    return gl.getParameter(gl.RENDERER) || '';
  } catch {
    return '';
  }
}

function getAudioFingerprint() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve('');
    try {
      const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!AudioContext) return resolve('');

      const context = new AudioContext(1, 44100, 44100);
      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, context.currentTime);
      compressor.knee.setValueAtTime(40, context.currentTime);
      compressor.ratio.setValueAtTime(12, context.currentTime);
      compressor.attack.setValueAtTime(0, context.currentTime);
      compressor.release.setValueAtTime(0.25, context.currentTime);

      oscillator.connect(compressor);
      compressor.connect(context.destination);
      oscillator.start(0);

      context.oncomplete = (event) => {
        try {
          const samples = event.renderedBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < samples.length; i += 100) {
            sum += Math.abs(samples[i]);
          }
          resolve(sum.toFixed(6));
        } catch {
          resolve('');
        }
      };

      context.startRendering();
      // Timeout fallback in case AudioContext hangs
      setTimeout(() => resolve(''), 300);
    } catch {
      resolve('');
    }
  });
}

/**
 * Main function to retrieve or compute the device fingerprint ID
 */
export async function getDeviceFingerprint() {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  if (typeof window === 'undefined') {
    return 'server_environment';
  }

  try {
    let nativeDeviceId = '';

    // 1. Try Native Capacitor Device plugin if running on Android/iOS APK
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getId();
        if (info && info.identifier) {
          nativeDeviceId = info.identifier;
        }
      }
    } catch {
      // Not on native or plugin not active
    }

    // 2. Browser entropy collection
    const persistentUuid = getOrSetPersistentUuid();
    const canvasFp = getCanvasFingerprint();
    const webglFp = getWebGLFingerprint();
    const audioFp = await getAudioFingerprint();

    const screenInfo = typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}_${window.devicePixelRatio || 1}`
      : '';

    const navInfo = typeof navigator !== 'undefined'
      ? `${navigator.platform || ''}_${navigator.language || ''}_${navigator.hardwareConcurrency || ''}_${navigator.maxTouchPoints || 0}`
      : '';

    const tz = typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : new Date().getTimezoneOffset().toString();

    // 3. Construct raw signature
    const rawFingerprint = [
      nativeDeviceId ? `NATIVE:${nativeDeviceId}` : '',
      `UUID:${persistentUuid}`,
      `SCREEN:${screenInfo}`,
      `NAV:${navInfo}`,
      `TZ:${tz}`,
      `GL:${webglFp}`,
      `AUDIO:${audioFp}`,
      `CANVAS:${canvasFp.substring(0, 150)}`
    ].join('||');

    // 4. Hash to compact identifier
    const hash = await hashString(rawFingerprint);
    cachedDeviceId = `dev_${hash.substring(0, 32)}`;
    return cachedDeviceId;
  } catch (err) {
    console.warn('Device fingerprint computation fallback:', err);
    const fallbackUuid = getOrSetPersistentUuid();
    cachedDeviceId = `dev_${fallbackUuid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
    return cachedDeviceId;
  }
}
