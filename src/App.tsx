/**
 * Main App Component
 * Router setup for Dashboard and Canvas views
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from './utils/db';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import Dashboard from './components/Dashboard/Dashboard';
import CanvasPage from './pages/CanvasPage';
import CollaborationTest from './pages/CollaborationTest';
import RealtimeTest from './pages/RealtimeTest';

function App() {
  // Initialize database on mount
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Sync data before page unload to prevent data loss
  useBeforeUnload({ enabled: true });

  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden">
        <Routes>
          {/* Dashboard - Homepage */}
          <Route path="/" element={<Dashboard />} />

          {/* Canvas - Board Editor */}
          <Route path="/board/:boardId" element={<CanvasPage />} />

          {/* Collaboration Test Page */}
          <Route path="/test/collaboration/:boardId?" element={<CollaborationTest />} />

          {/* Realtime Connection Test */}
          <Route path="/test/realtime" element={<RealtimeTest />} />

          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
