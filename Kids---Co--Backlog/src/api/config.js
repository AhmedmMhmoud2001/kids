/**
 * API configuration — no .env / import.meta.env required.
 * Deployed SPA (e.g. Vercel): calls PUBLIC_BACKEND_ORIGIN.
 * Local dev (Vite): uses same-origin `/api` (see vite proxy).
 */

/** Production API host (HTTPS, no trailing slash). Change here if backend moves. */
export const PUBLIC_BACKEND_ORIGIN = 'https://kids.nodeteam.site';

const LOCAL_VITE_BACKEND_PROXY = '/api'; // Proxied by vite.config.js → http://localhost:5000
export function isLocalDevOrigin() {
  if (typeof window === 'undefined') return false;
  const o = window.location?.origin || '';
  return o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
}

function normalizeBase(origin) {
  return String(origin || '').replace(/\/$/, '');
}

/**
 * Base URL including /api suffix (never trailing slash past /api).
 */
export const API_BASE_URL = (() => {
  if (typeof window === 'undefined') {
    return `${normalizeBase(PUBLIC_BACKEND_ORIGIN)}/api`;
  }
  const origin = window.location.origin || '';
  // Frontend served from same machine as backend
  if (origin.includes('kids.nodeteam.site')) {
    return `${normalizeBase(origin)}/api`;
  }
  if (origin.includes('tovo-b.developteam.site')) {
    return `${normalizeBase(origin)}/kids/api`;
  }
  // Vite dev: relative path hits dev-server proxy
  if (isLocalDevOrigin()) {
    return LOCAL_VITE_BACKEND_PROXY;
  }
  // Vercel: same-origin /api so rewrites (→ tovo-b.developteam.site/kids/api) work
  return '/api';
})();

/**
 * Host origin for socket/full URLs without /api (storefront rarely uses).
 */
export const API_HOST = (() => {
  if (typeof window === 'undefined') {
    return normalizeBase(PUBLIC_BACKEND_ORIGIN);
  }
  const origin = window.location.origin || '';
  if (origin.includes('kids.nodeteam.site')) return normalizeBase(origin);
  if (origin.includes('tovo-b.developteam.site')) {
    return `${normalizeBase(origin)}/kids`;
  }
  if (isLocalDevOrigin()) {
    return 'http://localhost:5000';
  }
  return normalizeBase(PUBLIC_BACKEND_ORIGIN);
})();

// Token refresh interval (access token ~15m)
export const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

export const API_TIMEOUT = 30000;
