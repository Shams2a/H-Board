/**
 * ViewControls Component
 * Bottom-right floating controls for view management
 */

import { useState, useEffect, useCallback } from 'react';
import { useUIStore, selectZoom, selectGridEnabled, useElementStore, useHistoryStore } from '../../store';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Grid,
  Undo,
  Redo
} from 'lucide-react';

export default function ViewControls() {
  const zoom = useUIStore(selectZoom);
  const gridEnabled = useUIStore(selectGridEnabled);
  const setZoom = useUIStore(state => state.setZoom);
  const toggleGrid = useUIStore(state => state.toggleGrid);
  const undo = useElementStore(state => state.undo);
  const redo = useElementStore(state => state.redo);
  const canUndo = useHistoryStore(state => state.canUndo());
  const canRedo = useHistoryStore(state => state.canRedo());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);

  return (
    <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-toolbar">
      <div className="flex flex-col items-center gap-2">
        {/* Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={`toolbar-button ${gridEnabled ? 'active' : ''}`}
          title="Toggle Grid"
          aria-label="Toggle grid"
        >
          <Grid className="w-6 h-6" />
        </button>

        <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="toolbar-button"
          title="Zoom Out"
          aria-label="Zoom out"
          disabled={zoom <= 0.25}
        >
          <ZoomOut className="w-6 h-6" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="toolbar-button"
          title="Zoom In"
          aria-label="Zoom in"
          disabled={zoom >= 2}
        >
          <ZoomIn className="w-6 h-6" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className={`toolbar-button ${isFullscreen ? 'active' : ''}`}
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </button>

        <div className="w-full h-px bg-gray-200" />

        {/* Undo */}
        <button
          onClick={undo}
          className="toolbar-button"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          disabled={!canUndo}
        >
          <Undo className="w-6 h-6" />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          className="toolbar-button"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          disabled={!canRedo}
        >
          <Redo className="w-6 h-6" />
        </button>

        <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

        {/* Zoom Level */}
        <div className="text-xs font-medium text-gray-600 dark:text-gray-300 px-2">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}
