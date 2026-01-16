/**
 * UUID generation utility
 * Provides a consistent way to generate UUIDs across the application
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique identifier
 * Uses uuid library for cross-browser compatibility
 */
export function generateId(): string {
  return uuidv4();
}
