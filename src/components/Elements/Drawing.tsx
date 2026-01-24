/**
 * Drawing Component
 * Freehand drawing canvas with pen and eraser tools
 */

import { useRef, useState, useEffect } from 'react';
import type { DrawingElement, DrawingPath } from '../../types';
import { useElementStore, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import {
  Pencil,
  Eraser,
  Trash2,
  GripVertical
} from 'lucide-react';

interface DrawingProps {
  element: DrawingElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function Drawing({ element, isSelected, onSelect: _onSelect, parentColumnId }: DrawingProps) {
  const { updateElement } = useElementStore();
  const { draggedElementId, justFinishedDrag } = useDragStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [thickness, setThickness] = useState(2);

  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted background color
  const backgroundColor = useDarkModeColor(element.style.backgroundColor || '#FFFFFF');

  const { handleMouseDown: handleDragMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDownSE } = useResizable({
    elementId: element.id,
    minWidth: 300,
    minHeight: 200,
    maxWidth: 1600,
    maxHeight: 1200,
    direction: 'se'
  });

  const { handleMouseDown: handleResizeMouseDownNW } = useResizable({
    elementId: element.id,
    minWidth: 300,
    minHeight: 200,
    maxWidth: 1600,
    maxHeight: 1200,
    direction: 'nw'
  });

  // Redraw canvas when paths change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    element.content.paths.forEach((path) => {
      if (path.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (path.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [element.content.paths]);

  const getRelativePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only draw when selected and not locked
    if (!isSelected || element.locked) {
      // Don't stop propagation - allow drag to work
      return;
    }

    e.stopPropagation();

    const pos = getRelativePosition(e);
    const newPath: DrawingPath = {
      points: [pos],
      color: tool === 'eraser' ? '#FFFFFF' : color,
      thickness: tool === 'eraser' ? thickness * 4 : thickness,
      tool
    };

    setIsDrawing(true);
    setCurrentPath(newPath);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPath) return;
    e.stopPropagation();

    const pos = getRelativePosition(e);
    const updatedPath = {
      ...currentPath,
      points: [...currentPath.points, pos]
    };

    setCurrentPath(updatedPath);

    // Draw current path in real-time
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lastPoint = currentPath.points[currentPath.points.length - 1];

    ctx.strokeStyle = updatedPath.color;
    ctx.lineWidth = updatedPath.thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (updatedPath.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
  };

  const handleCanvasMouseUp = async () => {
    if (!isDrawing || !currentPath) return;

    setIsDrawing(false);

    // Save path to element
    await updateElement(element.id, {
      content: {
        paths: [...element.content.paths, currentPath]
      }
    });

    setCurrentPath(null);
  };

  const handleClearDrawing = async () => {
    await updateElement(element.id, {
      content: {
        paths: []
      }
    });
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    // Don't handle if clicking on toolbar buttons or title bar (title bar has its own handler)
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('.drawing-header') ||
      target.closest('.drawing-toolbar')
    ) {
      return;
    }

    // If selected, only drag from title bar (handled separately)
    // If not selected, clicking on canvas also drags
    if (!isSelected) {
      handleDragMouseDown(e);
    }
  };

  const colors = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div
      ref={containerRef}
      data-element-id={element.id}
      className={`
        element-card ${(parentColumnId && !isBeingDragged) ? 'relative' : 'absolute'} overflow-hidden
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : isSelected ? '' : 'cursor-move'}
      `}
      style={{
        ...((parentColumnId && !isBeingDragged) ? {} : {
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
        }),
        width: (parentColumnId && !isBeingDragged) ? '100%' : `${element.size.width}px`,
        height: `${element.size.height}px`,
        backgroundColor,
        zIndex: element.zIndex,
        pointerEvents: isBeingDragged ? 'none' : 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Don't change selection if we just finished dragging
        if (justFinishedDrag) {
          return;
        }
        const isMultiSelect = e.ctrlKey || e.metaKey;
        const { selectElement } = useElementStore.getState();
        selectElement(element.id, isMultiSelect);
      }}
      onMouseDown={handleContainerMouseDown}
    >
      {/* Title Bar for Dragging */}
      <div
        className="drawing-header absolute top-0 left-0 right-0 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-2 py-1 flex items-center gap-2 cursor-move z-10"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleDragMouseDown(e);
        }}
      >
        <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">Drawing</span>
      </div>

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        width={element.size.width}
        height={element.size.height - 28 - (isSelected ? 48 : 0)} // Reserve space for title bar and toolbar
        className={`block mt-7 ${
          element.locked
            ? 'cursor-not-allowed'
            : isSelected
              ? 'cursor-crosshair'
              : 'cursor-move'
        }`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />

      {/* Toolbar */}
      {isSelected && !element.locked && (
        <div className="drawing-toolbar absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-2 flex items-center gap-3">
          {/* Tool Selection */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded transition-colors ${
                tool === 'pen'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
              }`}
              title="Pen"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded transition-colors ${
                tool === 'eraser'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Picker */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    color === c ? 'border-primary-600 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          )}

          {/* Thickness Slider */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-gray-600 dark:text-gray-300">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="flex-1 max-w-32"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300 w-6">{thickness}</span>
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClearDrawing}
            className="p-2 rounded bg-white dark:bg-gray-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-500 transition-colors"
            title="Clear drawing"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Resize handles */}
      {isSelected && !element.locked && (
        <>
          {/* Top-left resize handle */}
          <div
            className="absolute top-0 left-0 w-4 h-4 bg-primary-500 rounded-br cursor-nw-resize hover:bg-primary-600 transition-colors z-10"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResizeMouseDownNW(e);
            }}
            title="Drag to resize"
          />
          {/* Bottom-right resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-tl cursor-se-resize hover:bg-primary-600 transition-colors z-10"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResizeMouseDownSE(e);
            }}
            title="Drag to resize"
          />
        </>
      )}
    </div>
  );
}
