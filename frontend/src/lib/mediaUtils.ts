/**
 * Robust media type detection for file URLs, supporting Firebase/GCS formats.
 */

export type MediaType = "image" | "voice" | "pdf" | "doc" | "video" | "unknown";

/**
 * Extracts the file path or name from a URL by removing query parameters and hashes.
 */
const getCleanPath = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // For storage.googleapis.com, the pathname contains the file path
    // For firebasestorage.googleapis.com, the pathname also contains the file path (encoded)
    return urlObj.pathname;
  } catch (e) {
    // Fallback if not a valid URL (e.g. relative path)
    return url.split('?')[0].split('#')[0];
  }
};

/**
 * Detects the media type of a URL based on its extension.
 */
export const getMediaType = (url: string | undefined): MediaType => {
  if (!url) return "unknown";

  const cleanPath = getCleanPath(url);
  
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanPath)) {
    return "image";
  }
  
  if (/\.(pdf)$/i.test(cleanPath)) {
    return "pdf";
  }
  
  if (/\.(doc|docx|txt|rtf)$/i.test(cleanPath)) {
    return "doc";
  }
  
  if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(cleanPath) || url.includes("voice")) {
    return "voice";
  }

  if (/\.(mp4|webm|ogg|mov)$/i.test(cleanPath)) {
    return "video";
  }

  return "unknown";
};

/**
 * Normalized helper for image detection specifically.
 */
export const isImage = (url: string | undefined): boolean => getMediaType(url) === "image";

/**
 * Normalized helper for PDF detection.
 */
export const isPdf = (url: string | undefined): boolean => getMediaType(url) === "pdf";

/**
 * Normalized helper for Document detection.
 */
export const isDoc = (url: string | undefined): boolean => getMediaType(url) === "doc";

/**
 * Normalized helper for Voice detection.
 */
export const isVoice = (url: string | undefined): boolean => getMediaType(url) === "voice";

/**
 * Normalizes a URL by ensuring absolute paths start with / if they aren't already full URLs.
 */
export const normalizeUrl = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/")) {
    return url;
  }
  return `/${url}`;
};
