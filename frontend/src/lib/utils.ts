import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins class names. When two conflict (p-6 and p-0), the later one wins. */
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}
