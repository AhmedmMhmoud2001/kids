/**
 * API Configuration – connected to production server
 * Override with .env (VITE_API_URL, VITE_API_HOST) for local backend if needed
 */

// Vite environment variables must be prefixed with VITE_
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Host without /api (used by socket.io connection)
export const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

// Access token expires in 15 minutes, refresh before that
export const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes

// API timeout (in milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds
