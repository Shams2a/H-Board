/**
 * Main App Component
 * Assembles the main layout with Sidebar, Canvas, and Toolbar
 */

import { useEffect } from 'react';
import { initializeDatabase } from './utils/db';
import { useUIStore } from './store';
import Sidebar from './components/Sidebar/Sidebar';
import Breadcrumb from './components/Canvas/Breadcrumb';
import Canvas from './components/Canvas/Canvas';
import Toolbar from './components/Toolbar/Toolbar';

function App() {
  const { sidebarOpen, presentationMode } = useUIStore();

  // Initialize database on mount
  useEffect(() => {
    initializeDatabase();
  }, []);

  if (presentationMode) {
    return (
      <div className="h-full">
        <Canvas />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && <Sidebar />}

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb Navigation */}
          <Breadcrumb />

          {/* Canvas */}
          <Canvas />
        </div>
      </div>

      {/* Bottom Toolbar */}
      <Toolbar />
    </div>
  );
}

export default App;
