import { z } from 'zod';

/** Readable URL name: "kochi", "mens-haircut" — lowercase letters, numbers and single hyphens. */
export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'URL name must be at least 2 characters')
  .max(60, 'URL name must be at most 60 characters')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only')
  .refine((v) => !/^[0-9a-f]{24}$/.test(v), 'URL name cannot look like an id');
