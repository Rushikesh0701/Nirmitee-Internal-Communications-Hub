/**
 * Content sanitization utilities
 * Uses DOMPurify for safe HTML rendering
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content before rendering
 * Prevents XSS attacks while allowing safe HTML tags
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'video', 
      'iframe', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'style', 'class', 'target', 
      'rel', 'width', 'height', 'controls', 'allowfullscreen'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
};


