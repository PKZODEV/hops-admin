/**
 * Normalize image URLs to current production domain.
 * Rewrites legacy `http(s)://119.59.116.75/...` URLs (saved in DB before subdomain switch)
 * to `https://admin.bangkokhops.com/...` so they load over HTTPS without mixed-content blocks.
 */
export function imageUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url
    .replace(/^http:\/\/119\.59\.116\.75/, 'https://admin.bangkokhops.com')
    .replace(/^https:\/\/119\.59\.116\.75/, 'https://admin.bangkokhops.com');
}
