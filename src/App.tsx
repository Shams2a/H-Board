/**
 * Main App Component
 * Router setup with authentication
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from './utils/db';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute, LoginPage, AuthCallback } from './components/Auth';
import Dashboard from './components/Dashboard/Dashboard';
import CanvasPage from './pages/CanvasPage';
import CollaborationTest from './pages/CollaborationTest';
import RealtimeTest from './pages/RealtimeTest';

function AppContent() {
  const { isLoading } = useAuth();

  // Initialize database on mount
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Sync data before page unload to prevent data loss
  useBeforeUnload({ enabled: true });

  // Show loading while auth initializes
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
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

        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
