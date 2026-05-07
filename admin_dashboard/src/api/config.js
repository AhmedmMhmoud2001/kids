/**
 * API configuration — no .env / import.meta.env required.
 * Deployed dashboard: PUBLIC_BACKEND_ORIGIN.
 * Local Vite dev: `/api` + proxy to localhost:5000.
 */

/** Production backend (HTTPS, no trailing slash). */
export const PUBLIC_BACKEND_ORIGIN = 'https://kids.nodeteam.site';

const LOCAL_VITE_API_BASE = '/api';

export function isLocalDevOrigin() {
  if (typeof window === 'undefined') return false;
  const o = window.location?.origin || '';
  return o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
}

function normalizeBase(origin) {
  return String(origin || '').replace(/\/$/, '');
}

export const API_BASE_URL = (() => {
  if (typeof window === 'undefined') {
    return `${normalizeBase(PUBLIC_BACKEND_ORIGIN)}/api`;
  }
  if (isLocalDevOrigin()) {
    return LOCAL_VITE_API_BASE;
  }
  return `${normalizeBase(PUBLIC_BACKEND_ORIGIN)}/api`;
})();

/** Socket.io connects to backend origin without /api */
export const API_HOST = (() => {
  if (typeof window === 'undefined') {
    return normalizeBase(PUBLIC_BACKEND_ORIGIN);
  }
  if (isLocalDevOrigin()) {
    return 'http://localhost:5000';
  }
  return normalizeBase(PUBLIC_BACKEND_ORIGIN);
})();

export const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

export const API_TIMEOUT = 30000;
