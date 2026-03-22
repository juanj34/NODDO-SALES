/**
 * Shared video utility functions.
 * Resolves video sources (Cloudflare Stream, YouTube) and thumbnails.
 */

export function getVideoSrc(video: { stream_uid?: string | null; url: string }): string {
  if (video.stream_uid) {
    return `https://iframe.videodelivery.net/${video.stream_uid}`;
  }
  // Convert YouTube watch/shorts URLs to embed format
  const ytMatch = video.url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  return video.url;
}

export function getVideoThumb(video: {
  stream_uid?: string | null;
  thumbnail_url?: string | null;
  url: string;
}): string | null {
  if (video.thumbnail_url) return video.thumbnail_url;
  if (video.stream_uid) {
    return `https://videodelivery.net/${video.stream_uid}/thumbnails/thumbnail.jpg`;
  }
  // YouTube thumbnail fallback
  const match = video.url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}
