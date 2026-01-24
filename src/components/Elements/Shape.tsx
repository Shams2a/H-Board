/**
 * Shape Component
 * Renders geometric shapes (rectangle, circle, triangle, star)
 */

import { useRef, useState } from 'react';
import type { ShapeElement, ShapeType } from '../../types';
import { useElementStore, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import { Square, Circle, Triangle, Star } from 'lucide-react';

interface ShapeProps {
  element: ShapeElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function Shape({ element, isSelected, onSelect: _onSelect, parentColumnId }: ShapeProps) {
  const { updateElement } = useElementStore();
  const { draggedElementId, justFinishedDrag } = useDragStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  // Check if this element is currently being dragged
  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted fill color
  const fillColor = useDarkModeColor(element.style.backgroundColor || '#3B82F6');

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDownSE } = useResizable({
    elementId: element.id,
    minWidth: 50,
    minHeight: 50,
    maxWidth: 1200,
    maxHeight: 1200,
    direction: 'se'
  });

  const { handleMouseDown: handleResizeMouseDownNW } = useResizable({
    elementId: element.id,
    minWidth: 50,
    minHeight: 50,
    maxWidth: 1200,
    maxHeight: 1200,
    direction: 'nw'
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't handle click if we just finished dragging
    if (justFinishedDrag) {
      return;
    }

    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed for multi-selection
    const isMultiSelect = e.ctrlKey || e.metaKey;

    // Select with multi-select support
    const { selectElement } = useElementStore.getState();
    selectElement(element.id, isMultiSelect);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!element.locked) {
      setShowShapeMenu(!showShapeMenu);
    }
  };

  const changeShapeType = async (shapeType: ShapeType) => {
    await updateElement(element.id, {
      content: {
        ...element.content,
        shapeType
      }
    });
    setShowShapeMenu(false);
  };

  // Render SVG for different shapes
  const renderShape = () => {
    const width = element.size.width;
    const height = element.size.height;
    // fillColor is now computed above with dark mode support
    const strokeColor = element.style.borderColor || '#1E40AF';
    const strokeWidth = element.style.borderWidth || 2;

    switch (element.content.shapeType) {
      case 'rectangle':
        return (
          <svg width={width} height={height} className="w-full h-full">
            <rect
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              width={width - strokeWidth}
              height={height - strokeWidth}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rx={4}
            />
          </svg>
        );

      case 'circle':
        return (
          <svg width={width} height={height} className="w-full h-full">
            <ellipse
              cx={width / 2}
              cy={height / 2}
              rx={(width - strokeWidth) / 2}
              ry={(height - strokeWidth) / 2}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'triangle':
        return (
          <svg width={width} height={height} className="w-full h-full">
            <polygon
              points={`${width / 2},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'star':
        // Star with 5 points
        const cx = width / 2;
        const cy = height / 2;
        const outerRadius = Math.min(width, height) / 2 - strokeWidth;
        const innerRadius = outerRadius * 0.4;
        const points = [];

        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          points.push(`${x},${y}`);
        }

        return (
          <svg width={width} height={height} className="w-full h-full">
            <polygon
              points={points.join(' ')}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </svg>
        );

      default:
        return null;
    }
  };

  const shapeOptions: Array<{ type: ShapeType; icon: React.ReactNode; label: string }> = [
    { type: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
    { type: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
    { type: 'triangle', icon: <Triangle className="w-4 h-4" />, label: 'Triangle' },
    { type: 'star', icon: <Star className="w-4 h-4" />, label: 'Star' }
  ];

  return (
    <div
      ref={containerRef}
      data-element-id={element.id}
      className={`
        ${(parentColumnId && !isBeingDragged) ? 'relative' : 'absolute'}
        ${isSelected ? 'ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : 'cursor-move'}
      `}
      style={{
        ...((parentColumnId && !isBeingDragged) ? {} : {
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
        }),
        width: (parentColumnId && !isBeingDragged) ? '100%' : `${element.size.width}px`,
        height: `${element.size.height}px`,
        zIndex: element.zIndex,
        pointerEvents: isBeingDragged ? 'none' : 'auto',
        overflow: 'visible',
        backgroundColor: 'transparent'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Shape SVG */}
      {renderShape()}

      {/* Shape Type Menu */}
      {showShapeMenu && !element.locked && (
        <div
          className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[1000] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-1">
            {shapeOptions.map(option => (
              <button
                key={option.type}
                onClick={() => changeShapeType(option.type)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-left
                  ${element.content.shapeType === option.type ? 'bg-primary-100 text-primary-600' : 'text-gray-700'}
                `}
                title={option.label}
              >
                {option.icon}
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resize handles */}
      {isSelected && !element.locked && (
        <>
          {/* Top-left resize handle */}
          <div
            className="absolute top-0 left-0 w-4 h-4 bg-primary-500 rounded-br cursor-nw-resize hover:bg-primary-600 transition-colors"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResizeMouseDownNW(e);
            }}
            title="Drag to resize"
          />
          {/* Bottom-right resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-tl cursor-se-resize hover:bg-primary-600 transition-colors"
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
