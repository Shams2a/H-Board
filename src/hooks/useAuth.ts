/**
 * useAuth Hook
 * Convenient hook for accessing auth state and actions
 */

import { useEffect } from 'react';
import { useAuthStore, selectUser, selectSession, selectIsLoading, selectIsAuthenticated } from '../store/authStore';

interface UseAuthOptions {
  autoInitialize?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { autoInitialize = true } = options;

  const user = useAuthStore(selectUser);
  const session = useAuthStore(selectSession);
  const isLoading = useAuthStore(selectIsLoading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const error = useAuthStore(state => state.error);

  // Initialize auth on mount — always run to restore session from Supabase
  useEffect(() => {
    if (autoInitialize) {
      useAuthStore.getState().initialize();
    }
  }, [autoInitialize]);

  // Auto-refresh session before expiry
  useEffect(() => {
    if (!session?.expires_at) return;

    const expiresAt = session.expires_at * 1000;
    const now = Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

    if (expiresAt - now < refreshBuffer) {
      useAuthStore.getState().refreshSession();
      return;
    }

    const timeout = setTimeout(() => {
      useAuthStore.getState().refreshSession();
    }, expiresAt - now - refreshBuffer);

    return () => clearTimeout(timeout);
  }, [session?.expires_at]);

  return {
    // State
    user,
    session,
    isLoading,
    isAuthenticated,
    error,

    // Derived state
    userId: user?.id || null,
    userName: user?.name || 'Anonymous',
    userEmail: user?.email || null,

    // Actions
    signIn: useAuthStore.getState().signInWithOIDC,
    signOut: useAuthStore.getState().signOut,
    refreshSession: useAuthStore.getState().refreshSession,
    clearError: useAuthStore.getState().clearError,
  };
}

// Hook for requiring authentication
export function useRequireAuth() {
  const auth = useAuth();

  return {
    ...auth,
    isReady: !auth.isLoading,
    shouldRedirect: !auth.isLoading && !auth.isAuthenticated,
  };
}
