/**
 * API Configuration
 * Production: https://tovo-b.developteam.site/kids
 * لو الموقع شغال على Vercel أو أي دومين، يتصل بالسيرفر تلقائي (مش localhost).
 */

const PRODUCTION_API = 'https://kids.nodeteam.site/api';
const PRODUCTION_HOST = 'https://kids.nodeteam.site';
const LOCAL_API = 'http://localhost:5000/api';
const LOCAL_HOST = 'http://localhost:5000';

function isLocalOrigin() {
  if (typeof window === 'undefined') return false;
  const o = window.location?.origin || '';
  return o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
}

// Determine base API URL dynamically based on origin
// If running on production domain, use same-origin with /kids path when deployed under /kids
export const API_BASE_URL = (() => {
  try {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin || '';
      // If the frontend is served on the same backend domain, prefer same-origin.
      // Supports both deployment styles: root (/api) and subpath (/kids/api).
      if (origin.includes('kids.nodeteam.site')) {
        return origin.replace(/\/$/, '') + '/api';
      }
      if (origin.includes('tovo-b.developteam.site')) {
        return origin.replace(/\/$/, '') + '/kids/api';
      }
    }
  } catch {
    // fall back to default below
  }

  console.log(isLocalOrigin());
  console.log(isLocalOrigin() ? (import.meta?.env?.VITE_API_URL || LOCAL_API) : PRODUCTION_API);
  return isLocalOrigin() ? (import.meta?.env?.VITE_API_URL || LOCAL_API) : (import.meta?.env?.VITE_API_URL || PRODUCTION_API);
})();
export const API_HOST = isLocalOrigin() ? (import.meta.env.VITE_API_HOST || LOCAL_HOST) : (import.meta.env.VITE_API_HOST || PRODUCTION_HOST);

// Token refresh interval (in milliseconds)
// Access token expires in 15 minutes, refresh before that
export const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes

// API timeout (in milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds
