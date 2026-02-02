/**
 * useAuth Hook
 * Convenient hook for accessing auth state and actions
 */

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface UseAuthOptions {
  autoInitialize?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { autoInitialize = true } = options;

  const {
    user,
    session,
    isLoading,
    isAuthenticated,
    error,
    initialize,
    signInWithOIDC,
    signOut,
    refreshSession,
    clearError,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (autoInitialize && !isAuthenticated && !user) {
      initialize();
    }
  }, [autoInitialize, initialize, isAuthenticated, user]);

  // Auto-refresh session before expiry
  useEffect(() => {
    if (!session?.expires_at) return;

    const expiresAt = session.expires_at * 1000;
    const now = Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

    if (expiresAt - now < refreshBuffer) {
      refreshSession();
      return;
    }

    const timeout = setTimeout(() => {
      refreshSession();
    }, expiresAt - now - refreshBuffer);

    return () => clearTimeout(timeout);
  }, [session?.expires_at, refreshSession]);

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
    signIn: signInWithOIDC,
    signOut,
    refreshSession,
    clearError,
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
