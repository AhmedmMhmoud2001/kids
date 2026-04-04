/**
 * API Configuration
 * Production: https://tovo-b.developteam.site/kids
 * لو الموقع شغال على Vercel أو أي دومين، يتصل بالسيرفر تلقائي (مش localhost).
 */

const PRODUCTION_API = 'https://tovo-b.developteam.site/kids/api';
const PRODUCTION_HOST = 'https://tovo-b.developteam.site/kids';
const LOCAL_API = 'http://localhost:5000/api';
const LOCAL_HOST = 'http://localhost:5000';

function isLocalOrigin() {
  if (typeof window === 'undefined') return false;
  const o = window.location?.origin || '';
  return o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1');
}

// خارج localhost = نستخدم الإنتاج دائمًا (نتجاهل VITE_* لو كانت localhost)
export const API_BASE_URL = isLocalOrigin() ? (import.meta.env.VITE_API_URL || LOCAL_API) : PRODUCTION_API;
export const API_HOST = isLocalOrigin() ? (import.meta.env.VITE_API_HOST || LOCAL_HOST) : PRODUCTION_HOST;

// Token refresh interval (in milliseconds)
// Access token expires in 15 minutes, refresh before that
export const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes

// API timeout (in milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds
