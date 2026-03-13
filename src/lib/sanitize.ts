import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes HTML to prevent XSS attacks.
 * Allows basic formatting tags only.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "a", "blockquote", "code", "pre",
      "span", "div", "hr",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
}
