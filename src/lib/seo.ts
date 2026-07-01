// Small shared helpers for page metadata + structured data.

/** Strips HTML tags from Shopify's descriptionHtml and trims to a length
 * that's safe for a meta description (~155 chars is the widely-used cutoff
 * before Google truncates the snippet). */
export function stripHtml(html: string, maxLength = 155): string {
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLength
    ? `${plain.slice(0, maxLength - 3)}...`
    : plain;
}
