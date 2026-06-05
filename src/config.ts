/**
 * Application Configuration
 */

// Determine the base URL dynamically
// In development (AI Studio), we want to use the current origin
// In production (GitHub Pages), we want to use the hardcoded backend URL
const isProduction = typeof process !== 'undefined' 
  ? process.env.NODE_ENV === 'production' 
  : (typeof window !== 'undefined' && (window as any).location.hostname !== 'localhost'); // Fallback for browser if process is not defined
const isBrowser = typeof window !== 'undefined';
const isGitHubPages = isBrowser && window.location.hostname.includes('github.io');

export const API_BASE_URL = isGitHubPages 
  ? "https://ais-pre-3yn7g7wuqe5k5dfv5rpyzs-203126784499.europe-west2.run.app" 
  : (isBrowser ? window.location.origin : (process.env.API_BASE_URL || "https://ais-pre-3yn7g7wuqe5k5dfv5rpyzs-203126784499.europe-west2.run.app"));

if (isBrowser) {
  console.log("[Config] API_BASE_URL resolved to:", API_BASE_URL);
  console.log("[Config] hostname:", window.location.hostname);
  console.log("[Config] isGitHubPages:", isGitHubPages);
}
