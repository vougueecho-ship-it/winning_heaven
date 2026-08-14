'use client';

import { useEffect } from 'react';

function isPortalApp() {
  if (typeof navigator === 'undefined') return false;
  return /WinningHeavenPortalNative/i.test(navigator.userAgent || '');
}

function isDistributorApp() {
  if (typeof navigator === 'undefined') return false;
  return /WinningHeavenDistributorNative/i.test(navigator.userAgent || '');
}

function isPlayerApp() {
  if (typeof navigator === 'undefined') return false;
  return /WinningHeavenNative/i.test(navigator.userAgent || '');
}

function probeSafeAreaInsets() {
  if (typeof document === 'undefined') return { top: 0, bottom: 0 };
  const topEl = document.createElement('div');
  topEl.style.cssText =
    'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-top, 0px);';
  const botEl = document.createElement('div');
  botEl.style.cssText =
    'position:fixed;bottom:0;left:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-bottom, 0px);';
  document.documentElement.appendChild(topEl);
  document.documentElement.appendChild(botEl);
  const top = topEl.getBoundingClientRect().height || 0;
  const bottom = botEl.getBoundingClientRect().height || 0;
  topEl.remove();
  botEl.remove();
  return { top, bottom };
}

/**
 * Universal Safe Area & Chrome Manager:
 * Ensures the app content, top header bars, and bottom navigation
 * never overlap with Android/iOS status bars, notches, or system navigation bars.
 */
export default function NativeChrome() {
  useEffect(() => {
    let cancelled = false;

    if (isPortalApp()) {
      document.documentElement.classList.add('admin-native-shell');
    }
    if (isPlayerApp()) {
      document.documentElement.classList.add('player-native-shell');
    }
    if (isDistributorApp()) {
      document.documentElement.classList.add('distributor-native-shell');
    }

    const lockPageZoom = () => {
      if (cancelled || typeof document === 'undefined') return;
      const native =
        isPortalApp() ||
        isDistributorApp() ||
        isPlayerApp() ||
        window.Capacitor?.isNativePlatform?.() === true;
      if (!native) return;

      document.documentElement.classList.add('native-no-zoom');
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      );
    };

    const blockGestureZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const syncSafeAreaInsets = () => {
      if (cancelled || typeof document === 'undefined') return;
      const insets = probeSafeAreaInsets();
      const isNative =
        isPortalApp() ||
        isDistributorApp() ||
        isPlayerApp() ||
        window.Capacitor?.isNativePlatform?.() === true ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

      const isAndroid = /Android/i.test(navigator.userAgent || '');

      let topPx = insets.top;
      let bottomPx = insets.bottom;

      // On Android native apps / WebViews where env(safe-area) returns 0
      // but the status bar overlays the WebView, apply safe physical defaults.
      if (topPx < 1 && isNative) {
        topPx = isAndroid ? 38 : 44;
      } else if (topPx > 0) {
        topPx = Math.max(topPx, isAndroid ? 32 : 44);
      }

      if (bottomPx < 1 && isNative && isAndroid) {
        bottomPx = 20;
      }

      const topStr = `${Math.round(topPx)}px`;
      const botStr = `${Math.round(bottomPx)}px`;

      document.documentElement.style.setProperty('--sat', topStr);
      document.documentElement.style.setProperty('--sab', botStr);
      document.documentElement.style.setProperty('--admin-sat', topStr);
      document.documentElement.style.setProperty('--admin-sab', botStr);
      document.documentElement.style.setProperty('--safe-area-top', topStr);
      document.documentElement.style.setProperty('--safe-area-bottom', botStr);
    };

    const configure = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform() || cancelled) return;

        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#080a11' });
        await StatusBar.setStyle({ style: Style.Dark });
        syncSafeAreaInsets();
        lockPageZoom();
      } catch {
        // Fallback for web / missing plugin
      }
      syncSafeAreaInsets();
      lockPageZoom();
    };

    lockPageZoom();
    syncSafeAreaInsets();
    configure();

    document.addEventListener('touchmove', blockGestureZoom, { passive: false });
    window.addEventListener('resize', syncSafeAreaInsets);
    window.addEventListener('orientationchange', syncSafeAreaInsets);

    const t1 = window.setTimeout(syncSafeAreaInsets, 200);
    const t2 = window.setTimeout(syncSafeAreaInsets, 600);
    const t3 = window.setTimeout(syncSafeAreaInsets, 1500);
    const t4 = window.setTimeout(syncSafeAreaInsets, 3000);

    return () => {
      cancelled = true;
      document.removeEventListener('touchmove', blockGestureZoom);
      window.removeEventListener('resize', syncSafeAreaInsets);
      window.removeEventListener('orientationchange', syncSafeAreaInsets);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, []);

  return null;
}
