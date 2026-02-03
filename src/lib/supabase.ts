/**
 * Supabase Client
 * Singleton instance for interacting with Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not configured. App will run in offline-only mode.');
  console.warn('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file');
}

// Create Supabase client (will be null if credentials not provided)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'h-board-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public'
      }
    })
  : null;

/**
 * Check if Supabase is configured and available
 */
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

/**
 * Test Supabase connection
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('boards').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};
