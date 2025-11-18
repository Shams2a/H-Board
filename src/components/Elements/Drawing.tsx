/**
 * Drawing Component
 * Freehand drawing canvas with pen and eraser tools
 */

import { useRef, useState, useEffect } from 'react';
import type { DrawingElement, DrawingPath } from '../../types';
import { useElementStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
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

export default function Drawing({ element, isSelected, onSelect, parentColumnId }: DrawingProps) {
  const { updateElement } = useElementStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [thickness, setThickness] = useState(2);

  const { handleMouseDown: handleDragMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDown } = useResizable({
    elementId: element.id,
    minWidth: 300,
    minHeight: 200,
    maxWidth: 1600,
    maxHeight: 1200
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
    if (!isSelected || element.locked) return;
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

  const colors = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div
      ref={containerRef}
      className={`
        element-card absolute overflow-hidden
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : ''}
      `}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
        backgroundColor: element.style.backgroundColor || '#FFFFFF',
        zIndex: element.zIndex
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      {/* Title Bar for Dragging */}
      <div
        className="drawing-header absolute top-0 left-0 right-0 bg-gray-100 border-b border-gray-200 px-2 py-1 flex items-center gap-2 cursor-move z-10"
        onMouseDown={handleDragMouseDown}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-600 flex-1">Drawing</span>
      </div>

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        width={element.size.width}
        height={element.size.height - 28 - (isSelected ? 48 : 0)} // Reserve space for title bar and toolbar
        className={`block mt-7 ${isSelected && !element.locked ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />

      {/* Toolbar */}
      {isSelected && !element.locked && (
        <div className="drawing-toolbar absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-2 flex items-center gap-3">
          {/* Tool Selection */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded transition-colors ${
                tool === 'pen'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
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
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Picker */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
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
            <span className="text-xs text-gray-600">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="flex-1 max-w-32"
            />
            <span className="text-xs text-gray-600 w-6">{thickness}</span>
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClearDrawing}
            className="p-2 rounded bg-white text-red-500 hover:bg-red-50 transition-colors"
            title="Clear drawing"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Resize handle */}
      {isSelected && !element.locked && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-tl cursor-se-resize hover:bg-primary-600 transition-colors z-10"
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize"
        />
      )}
    </div>
  );
}
