// Central API configuration
// In production (Vercel), set VITE_API_URL in the Vercel dashboard Environment Variables.
// In local dev, defaults to http://localhost:8000
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');
