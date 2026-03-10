/**
 * ProtectedRoute Component
 * Guards routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useRequireAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  loadingFallback
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isReady, shouldRedirect } = useRequireAuth();

  // Show loading state
  if (!isReady) {
    return loadingFallback || (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (shouldRedirect) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
