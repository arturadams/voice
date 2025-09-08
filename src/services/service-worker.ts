/// <reference path="../vite-env.d.ts" />
import { registerSW } from 'virtual:pwa-register';

/**
 * Register the service worker if the current browser supports it. Browsers like
 * Chrome on iOS do not support service workers, so this safely no-ops there.
 */
export function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      registerSW({ immediate: true });
    } catch (e) {
      console.warn('Service worker registration failed', e);
    }
  }
}
