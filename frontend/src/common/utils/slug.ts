import { z } from 'zod';

/** Same rule as the backend: "Men's Haircut & Beard" → "mens-haircut-and-beard". */
export const slugify = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Optional "URL name" form field: empty = create it from the name automatically. */
export const slugFormField = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === '' || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), {
    message: 'Use lowercase letters, numbers and hyphens only (e.g. kochi-central)',
  })
  .refine((v) => v === '' || (v.length >= 2 && v.length <= 60), {
    message: 'URL name must be 2–60 characters',
  })
  .optional();

/** Send the slug only when the admin typed one. */
export const slugForSubmit = (value?: string): string | undefined => value?.trim() || undefined;
