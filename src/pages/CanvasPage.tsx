/**
 * Canvas Page
 * Full canvas view for working on a board
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBoardStore } from '../store';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Breadcrumb from '../components/Canvas/Breadcrumb';
import Canvas from '../components/Canvas/Canvas';
import Toolbar from '../components/Toolbar/Toolbar';
import ViewControls from '../components/Toolbar/ViewControls';
import CustomizationSidebar from '../components/Sidebar/CustomizationSidebar';

export default function CanvasPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { setCurrentBoard, getCurrentBoard, loadBoards } = useBoardStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

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
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Board introuvable
          </h2>
          <p className="text-gray-600 mb-4">
            Ce projet n'existe pas ou a été supprimé
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Back to Dashboard */}
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Retour au dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1">
            <Breadcrumb />
          </div>
        </div>
      </div>

      {/* Canvas Area with Floating Controls */}
      <div className="flex-1 overflow-hidden relative">
        <Canvas />

        {/* Floating Toolbars */}
        <Toolbar />
        <ViewControls />
        <CustomizationSidebar />
      </div>
    </div>
  );
}
