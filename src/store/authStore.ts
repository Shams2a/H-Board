/**
 * Auth Store
 * Manages authentication state with Authentik via Supabase OIDC
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// User profile with OIDC claims
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredUsername?: string;
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithOIDC: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

// Extract user profile from Supabase user
const extractUserProfile = (user: User): AuthUser => {
  const metadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email || '',
    name: metadata.full_name || metadata.name || metadata.preferred_username || user.email?.split('@')[0] || 'User',
    avatarUrl: metadata.avatar_url || metadata.picture,
    preferredUsername: metadata.preferred_username,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      initialize: async () => {
        if (!supabase) {
          set({ isLoading: false, error: 'Supabase not configured' });
          return;
        }

        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) throw error;

          if (session?.user) {
            set({
              user: extractUserProfile(session.user),
              session,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }

          // Listen for auth state changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            logger.debug('Auth state change:', event);

            if (event === 'SIGNED_IN' && session?.user) {
              set({
                user: extractUserProfile(session.user),
                session,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              set({ session });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            error: error instanceof Error ? error.message : 'Authentication failed',
            isLoading: false,
          });
        }
      },

      signInWithOIDC: async () => {
        if (!supabase) {
          set({ error: 'Supabase not configured' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'keycloak',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              scopes: 'openid email profile',
            },
          });

          if (error) throw error;
        } catch (error) {
          console.error('OIDC sign in error:', error);
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false,
          });
        }
      },

      signOut: async () => {
        if (!supabase) return;

        set({ isLoading: true });

        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Clear localStorage user ID from previous anonymous mode
          localStorage.removeItem('h-board-user-id');
        } catch (error) {
          console.error('Sign out error:', error);
          set({
            error: error instanceof Error ? error.message : 'Sign out failed',
            isLoading: false,
          });
        }
      },

      refreshSession: async () => {
        if (!supabase) return;

        try {
          const { data: { session }, error } = await supabase.auth.refreshSession();
          if (error) throw error;

          if (session) {
            set({
              session,
              user: extractUserProfile(session.user),
            });
          }
        } catch (error) {
          console.error('Session refresh error:', error);
          get().signOut();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'h-board-auth-state',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors
type AuthStoreState = ReturnType<typeof useAuthStore.getState>;
export const selectUser = (state: AuthStoreState) => state.user;
export const selectIsAuthenticated = (state: AuthStoreState) => state.isAuthenticated;
export const selectSession = (state: AuthStoreState) => state.session;
export const selectIsLoading = (state: AuthStoreState) => state.isLoading;
