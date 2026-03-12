/**
 * Main App Component
 * Router setup with authentication
 */

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from './utils/db';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute, LoginPage, AuthCallback } from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded route-level components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const CanvasPage = lazy(() => import('./pages/CanvasPage'));
const CollaborationTest = lazy(() => import('./pages/CollaborationTest'));
const RealtimeTest = lazy(() => import('./pages/RealtimeTest'));

function LoadingSpinner() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#101418]">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 dark:text-[#B1B9C4]">Chargement...</p>
      </div>
    </div>
  );
}

function AppContent() {
  // Initialize auth (ProtectedRoute handles its own loading state)
  useAuth();

  // Initialize database on mount
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Sync data before page unload to prevent data loss
  useBeforeUnload({ enabled: true });

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/board/:boardId"
          element={
            <ProtectedRoute>
              <CanvasPage />
            </ProtectedRoute>
          }
        />

        {import.meta.env.DEV && (
          <>
            <Route
              path="/test/collaboration/:boardId?"
              element={
                <ProtectedRoute>
                  <CollaborationTest />
                </ProtectedRoute>
              }
            />

            <Route
              path="/test/realtime"
              element={
                <ProtectedRoute>
                  <RealtimeTest />
                </ProtectedRoute>
              }
            />
          </>
        )}

        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
