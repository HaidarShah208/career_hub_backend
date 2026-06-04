import { randomBytes } from 'crypto';

/**
 * Converts an arbitrary string into a URL-friendly slug.
 */
export function slugify(input: string): string {
  return input
    .toString()
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a slug with a short random suffix to guarantee uniqueness even
 * when two jobs share the same title.
 */
export function uniqueSlug(input: string): string {
  const base = slugify(input) || 'job';
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}
