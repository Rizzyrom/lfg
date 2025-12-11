import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names with Tailwind CSS class deduplication
 * Combines clsx for conditional classes with tailwind-merge for smart merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
