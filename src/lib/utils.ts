import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { API_BASE_URL } from "../config";

export function getImageUrl(url: string, size?: string): string {
  if (!url) return 'https://via.placeholder.com/400?text=No+Image';
  if (url.startsWith('http')) return getDirectDriveLink(url, size);
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/uploads/${url}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDirectDriveLink(url: string, size: string = 'w800'): string {
  if (!url) return "";
  
  // Handle Google Redirects (common when copying links from search)
  if (url.includes('google.com/url') && (url.includes('q=') || url.includes('url='))) {
    try {
      const urlObj = new URL(url);
      const actualUrl = urlObj.searchParams.get('q') || urlObj.searchParams.get('url');
      if (actualUrl) {
        // Recursively clean the extracted URL
        return getDirectDriveLink(decodeURIComponent(actualUrl), size);
      }
    } catch (e) {
      console.error("Error parsing google redirect URL:", e);
    }
  }

  // If it's already a thumbnail link, return as is (but replace/ensure sz)
  if (url.includes('drive.google.com/thumbnail')) {
    if (url.includes('sz=')) {
        return url.replace(/sz=[^&]+/, `sz=${size}`);
    }
    return `${url}&sz=${size}`;
  }

  // Extract ID from various Google Drive URL formats
  let fileId = "";
  
  // Format: drive.google.com/file/d/FILE_ID/view
  const driveFileRegex = /\/file\/d\/([^\/?]+)/;
  const driveIdMatch = url.match(driveFileRegex);
  
  if (driveIdMatch && driveIdMatch[1]) {
    fileId = driveIdMatch[1];
  } else {
    // Format: drive.google.com/uc?id=FILE_ID or open?id=FILE_ID
    const driveUcRegex = /[?&]id=([^&]+)/;
    const driveUcMatch = url.match(driveUcRegex);
    if (url.includes('drive.google.com') && driveUcMatch && driveUcMatch[1]) {
      fileId = driveUcMatch[1];
    }
  }

  // Also check for usercontent links
  if (!fileId && (url.includes('lh3.googleusercontent.com/u/0/d/') || url.includes('lh3.google.com/u/0/d/'))) {
    const lhMatch = /\/d\/([^\/=]+)/;
    const match = url.match(lhMatch);
    if (match && match[1]) fileId = match[1];
  }
  
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }

  return url;
}
