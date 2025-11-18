/**
 * ViewControls Component
 * Bottom-right floating controls for view management
 */

import { useUIStore } from '../../store';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Undo,
  Redo
} from 'lucide-react';

export default function ViewControls() {
  const { zoom, setZoom, gridEnabled, toggleGrid, resetView } = useUIStore();

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);

  return (
    <div className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-toolbar">
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

        <div className="w-full h-px bg-gray-200" />

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

        {/* Reset View */}
        <button
          onClick={resetView}
          className="toolbar-button"
          title="Reset View (Ctrl+0)"
          aria-label="Reset view"
        >
          <Maximize className="w-6 h-6" />
        </button>

        <div className="w-full h-px bg-gray-200" />

        {/* Undo */}
        <button
          className="toolbar-button"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo className="w-6 h-6" />
        </button>

        {/* Redo */}
        <button
          className="toolbar-button"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
