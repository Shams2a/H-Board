/**
 * Main App Component
 * Router setup for Dashboard and Canvas views
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from './utils/db';
import Dashboard from './components/Dashboard/Dashboard';
import CanvasPage from './pages/CanvasPage';

function App() {
  // Initialize database on mount
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden">
        <Routes>
          {/* Dashboard - Homepage */}
          <Route path="/" element={<Dashboard />} />

          {/* Canvas - Board Editor */}
          <Route path="/board/:boardId" element={<CanvasPage />} />

          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
