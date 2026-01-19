/**
 * Canvas Page
 * Full canvas view for working on a board
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { useBoardStore } from '../store';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { usePresence } from '../hooks/usePresence';
import { useCursorTracking } from '../hooks/useCursorTracking';
import Breadcrumb from '../components/Canvas/Breadcrumb';
import RemoteCursors from '../components/Collaboration/RemoteCursors';
import Canvas from '../components/Canvas/Canvas';
import Toolbar from '../components/Toolbar/Toolbar';
import ViewControls from '../components/Toolbar/ViewControls';
import CustomizationSidebar from '../components/Sidebar/CustomizationSidebar';
import KeyboardShortcutsModal from '../components/Modals/KeyboardShortcutsModal';
import ExportModal from '../components/Modals/ExportModal';
import { NewSyncStatus } from '../components/SyncStatus/NewSyncStatus';
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle';
import ActiveUsers from '../components/Collaboration/ActiveUsers';

export default function CanvasPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { setCurrentBoard, getCurrentBoard, loadBoards } = useBoardStore();
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Generate a consistent user ID (in production, use real auth)
  const [userId] = useState(() => {
    let id = localStorage.getItem('h-board-user-id');
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('h-board-user-id', id);
    }
    return id;
  });

  // Enable real-time collaboration
  useRealtimeSync({
    boardId: boardId || '',
    userId,
    enabled: !!boardId,
  });

  // Track active users
  const { activeUsers } = usePresence({
    boardId: boardId || '',
    userId,
    userName: `User ${userId.slice(0, 8)}`,
    enabled: !!boardId,
  });

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onShowHelp: () => setShowKeyboardShortcuts(true)
  });

  // Track and broadcast cursor position
  useCursorTracking({
    enabled: !!boardId,
  });

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (boardId) {
      setCurrentBoard(boardId);
    }
  }, [boardId, setCurrentBoard]);

  const currentBoard = getCurrentBoard();

  if (!currentBoard) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Board introuvable
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ce projet n'existe pas ou a été supprimé
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Back to Dashboard */}
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Retour au dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1">
            <Breadcrumb />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Active Users */}
            <ActiveUsers users={activeUsers} maxVisible={5} showCount={true} />

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Export (Ctrl+E)"
            >
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Sync Status Indicator */}
            <NewSyncStatus />
          </div>
        </div>
      </div>

      {/* Canvas Area with Floating Controls */}
      <div className="flex-1 overflow-hidden relative">
        <Canvas onExport={() => setShowExportModal(true)} />

        {/* Floating Toolbars - Only for Canvas boards */}
        {currentBoard.type === 'canvas' && (
          <>
            <Toolbar />
            <ViewControls />
            <CustomizationSidebar />
          </>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Remote Cursors Overlay */}
      <RemoteCursors />
    </div>
  );
}
