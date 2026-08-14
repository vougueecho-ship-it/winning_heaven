'use client';

import { useEffect } from 'react';
import { isChunkLoadFailure } from '../lib/lazyWithRetry';

export default function ClientChunkGuard() {
  useEffect(() => {
    const handleRejection = (event) => {
      if (isChunkLoadFailure(event?.reason)) {
        event.preventDefault();
        try {
          const lastReload = sessionStorage.getItem('chunk_reload_ts');
          const now = Date.now();
          if (!lastReload || now - Number(lastReload) > 8000) {
            sessionStorage.setItem('chunk_reload_ts', String(now));
            window.location.reload();
          }
        } catch {
          window.location.reload();
        }
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return null;
}
