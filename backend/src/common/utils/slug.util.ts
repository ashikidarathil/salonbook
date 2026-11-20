import type { Model, Types } from 'mongoose';
import { AppError } from '../errors/appError';
import { HttpStatus } from '../enums/httpStatus.enum';

/** "Men's Haircut & Beard" → "mens-haircut-and-beard" */
export const slugify = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

/** First free slug for the model: base, base-2, base-3, … (ignores the document itself). */
export async function uniqueSlug<T>(
  model: Model<T>,
  base: string,
  excludeId?: Types.ObjectId | string,
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  for (let n = 2; ; n++) {
    const taken = await model.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    } as never);
    if (!taken) return candidate;
    candidate = `${root}-${n}`;
  }
}

/** A value is an ObjectId string (24 hex chars) rather than a slug. */
export const looksLikeObjectId = (value: string): boolean => /^[0-9a-fA-F]{24}$/.test(value);

/** Throws 409 when another document of the model already uses this slug. */
export async function assertSlugAvailable<T>(
  model: Model<T>,
  slug: string,
  excludeId?: Types.ObjectId | string,
): Promise<void> {
  const taken = await model.exists({
    slug,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  } as never);
  if (taken) {
    throw new AppError(`The URL name "${slug}" is already in use`, HttpStatus.CONFLICT);
  }
}
