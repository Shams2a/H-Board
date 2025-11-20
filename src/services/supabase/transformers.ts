/**
 * Data Transformers
 * Convert between camelCase (TypeScript) and snake_case (PostgreSQL/Supabase)
 */

import type { Board, BoardElement, Folder } from '../../types';

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from camelCase to snake_case
 */
function objectToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(objectToSnakeCase);
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = objectToSnakeCase(value);
  }
  return result;
}

/**
 * Convert object keys from snake_case to camelCase
 */
function objectToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(objectToCamelCase);
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);

    // Convert date strings to Date objects
    if (typeof value === 'string' && (key.endsWith('_at') || camelKey.endsWith('At'))) {
      result[camelKey] = new Date(value);
    } else {
      result[camelKey] = objectToCamelCase(value);
    }
  }
  return result;
}

/**
 * Transform Element from TypeScript format to Supabase format
 */
export function elementToSupabase(element: Partial<BoardElement>): any {
  const transformed = objectToSnakeCase(element);

  // Ensure JSONB fields are properly formatted
  if (element.position) {
    transformed.position = element.position;
  }
  if (element.size) {
    transformed.size = element.size;
  }
  if (element.style) {
    transformed.style = element.style;
  }
  if (element.content) {
    transformed.content = element.content;
  }

  return transformed;
}

/**
 * Transform Element from Supabase format to TypeScript format
 */
export function elementFromSupabase(data: any): BoardElement {
  const transformed = objectToCamelCase(data);

  return {
    ...transformed,
    deletedAt: transformed.deletedAt || null,
  } as BoardElement;
}

/**
 * Transform Board from TypeScript format to Supabase format
 */
export function boardToSupabase(board: Partial<Board>): any {
  const transformed = objectToSnakeCase(board);

  // Handle settings JSONB field
  if (board.settings) {
    transformed.settings = board.settings;
  }

  // Handle tags array
  if (board.tags) {
    transformed.tags = board.tags;
  }

  // Remove fields that don't exist in Supabase schema
  delete transformed.last_access;
  delete transformed.last_accessed;
  delete transformed.tags;

  return transformed;
}

/**
 * Transform Board from Supabase format to TypeScript format
 */
export function boardFromSupabase(data: any): Board {
  const transformed = objectToCamelCase(data);

  // Ensure default values for fields not in Supabase
  return {
    ...transformed,
    tags: transformed.tags || [],
    lastAccess: transformed.lastAccess || new Date(),
    deletedAt: transformed.deletedAt || null,
  } as Board;
}

/**
 * Transform Folder from TypeScript format to Supabase format
 */
export function folderToSupabase(folder: Partial<Folder>): any {
  return objectToSnakeCase(folder);
}

/**
 * Transform Folder from Supabase format to TypeScript format
 */
export function folderFromSupabase(data: any): Folder {
  const transformed = objectToCamelCase(data);
  return {
    ...transformed,
    deletedAt: transformed.deletedAt || null,
  } as Folder;
}

/**
 * Transform array of items
 */
export function transformArray<T, R>(
  items: T[],
  transformer: (item: T) => R
): R[] {
  return items.map(transformer);
}
