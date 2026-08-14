/**
 * safeFetch.js - Universal resilient API client & error sanitizer
 * Prevents HTML / <!DOCTYPE / SyntaxError exceptions from ever reaching UI toasts.
 */

export function cleanErrorMessage(err, fallback = 'Operation failed. Please try again.') {
  if (!err) return fallback;
  const msg = typeof err === 'string' ? err : String(err.message || err.error || fallback);

  // Filter out raw JSON parsing & HTML errors
  if (
    msg.includes('<!DOCTYPE') ||
    msg.includes('<html') ||
    msg.includes('Unexpected token') ||
    msg.includes('is not valid JSON') ||
    msg.includes('JSON.parse') ||
    msg.includes('JSON at position')
  ) {
    return 'Server is temporarily busy or updating. Please try again in a moment.';
  }

  // Filter out raw network / fetch errors
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    msg.includes('Load failed') ||
    msg.includes('The user aborted a request')
  ) {
    return 'Unable to connect to server. Please check your internet connection and try again.';
  }

  return msg || fallback;
}

function getHttpErrorMessage(status) {
  switch (status) {
    case 400:
      return 'Invalid request details. Please check your input.';
    case 401:
      return 'Incorrect email or password.';
    case 403:
      return 'Account access restricted or suspended. Please contact support.';
    case 404:
      return 'Service endpoint not found. Please refresh the page.';
    case 413:
      return 'Uploaded file or image is too large. Please choose a smaller file.';
    case 429:
      return 'Too many requests. Please wait a few seconds and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server is temporarily updating. Please try again in a moment.';
    default:
      return 'Connection error. Please try again.';
  }
}

/**
 * Universal safe fetcher that never throws SyntaxError on HTML responses.
 * Returns: { ok: boolean, status: number, data: object }
 */
export async function safeFetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions = {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const res = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const text = await res.text();

    let data = null;
    if (text && text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!data) {
      const fallbackMsg = getHttpErrorMessage(res.status);
      data = {
        success: res.ok,
        message: fallbackMsg
      };
    }

    return {
      ok: res.ok && (data.success !== false),
      status: res.status,
      data
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message: cleanErrorMessage(err, 'Unable to connect to server. Please check your internet connection.')
      }
    };
  }
}

/** Check if running inside Android / iOS native Capacitor app */
export function isNativePlatform() {
  if (typeof window === 'undefined') return false;
  if (window.Capacitor?.isNativePlatform?.()) return true;
  if (typeof navigator !== 'undefined' && /WinningHeavenNative/i.test(navigator.userAgent)) return true;
  return false;
}
