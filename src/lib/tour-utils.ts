/**
 * Extracts a clean URL from either a direct URL or an iframe embed code.
 * Returns "" if input is empty or no valid URL is found.
 */
export function extractTourUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // If input contains an iframe tag, extract the src attribute
  if (trimmed.toLowerCase().includes("<iframe")) {
    const match = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    if (match?.[1]) {
      const url = match[1];
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
    }
    return "";
  }

  // If it's a direct URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return "";
}
