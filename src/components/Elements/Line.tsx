/**
 * Line Component
 * Drawable line/arrow for connecting elements or freeform annotations
 */

import { useRef, useState } from 'react';
import type { LineElement } from '../../types';
import { useElementStore } from '../../store';
import {
  ArrowRight,
  ArrowLeft,
  Minus,
  MoreVertical
} from 'lucide-react';

interface LineProps {
  element: LineElement;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function Line({ element, isSelected, onSelect }: LineProps) {
  const { updateElement } = useElementStore();
  const containerRef = useRef<SVGSVGElement>(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  const startPoint = element.content.startPoint;
  const endPoint = element.content.endPoint;
  const lineStyle = element.content.lineStyle || 'solid';
  const arrowStart = element.content.arrowStart || false;
  const arrowEnd = element.content.arrowEnd || true;

  // Calculate SVG viewBox to contain both points
  const minX = Math.min(startPoint.x, endPoint.x);
  const minY = Math.min(startPoint.y, endPoint.y);
  const maxX = Math.max(startPoint.x, endPoint.x);
  const maxY = Math.max(startPoint.y, endPoint.y);
  const width = maxX - minX + 40; // Add padding for arrows
  const height = maxY - minY + 40;

  // Local coordinates within SVG
  const localStartX = startPoint.x - minX + 20;
  const localStartY = startPoint.y - minY + 20;
  const localEndX = endPoint.x - minX + 20;
  const localEndY = endPoint.y - minY + 20;

  const handleStartDrag = (e: React.MouseEvent) => {
    if (element.locked || !isSelected) return;
    e.stopPropagation();
    setIsDraggingStart(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const canvas = document.querySelector('.canvas-container');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const newX = moveEvent.clientX - rect.left;
      const newY = moveEvent.clientY - rect.top;

      updateElement(element.id, {
        content: {
          ...element.content,
          startPoint: { x: newX, y: newY }
        }
      });
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleEndDrag = (e: React.MouseEvent) => {
    if (element.locked || !isSelected) return;
    e.stopPropagation();
    setIsDraggingEnd(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const canvas = document.querySelector('.canvas-container');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const newX = moveEvent.clientX - rect.left;
      const newY = moveEvent.clientY - rect.top;

      updateElement(element.id, {
        content: {
          ...element.content,
          endPoint: { x: newX, y: newY }
        }
      });
    };

    const handleMouseUp = () => {
      setIsDraggingEnd(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleLineStyle = async () => {
    const styles: Array<'solid' | 'dashed' | 'dotted'> = ['solid', 'dashed', 'dotted'];
    const currentIndex = styles.indexOf(lineStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];

    await updateElement(element.id, {
      content: {
        ...element.content,
        lineStyle: nextStyle
      }
    });
  };

  const toggleArrowStart = async () => {
    await updateElement(element.id, {
      content: {
        ...element.content,
        arrowStart: !arrowStart
      }
    });
  };

  const toggleArrowEnd = async () => {
    await updateElement(element.id, {
      content: {
        ...element.content,
        arrowEnd: !arrowEnd
      }
    });
  };

  // Get stroke dash array based on style
  const getStrokeDashArray = () => {
    switch (lineStyle) {
      case 'dashed':
        return '10,5';
      case 'dotted':
        return '2,3';
      default:
        return 'none';
    }
  };

  return (
    <>
      <svg
        ref={containerRef}
        className={`absolute pointer-events-none ${isSelected ? 'selected' : ''}`}
        style={{
          left: `${minX - 20}px`,
          top: `${minY - 20}px`,
          width: `${width}px`,
          height: `${height}px`,
          zIndex: element.zIndex,
          overflow: 'visible'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
      >
        <defs>
          {/* Arrow marker for end */}
          <marker
            id={`arrowhead-end-${element.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={element.style.borderColor || '#374151'}
            />
          </marker>

          {/* Arrow marker for start */}
          <marker
            id={`arrowhead-start-${element.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="0"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M9,0 L9,6 L0,3 z"
              fill={element.style.borderColor || '#374151'}
            />
          </marker>
        </defs>

        {/* Main line */}
        <line
          x1={localStartX}
          y1={localStartY}
          x2={localEndX}
          y2={localEndY}
          stroke={element.style.borderColor || '#374151'}
          strokeWidth={element.style.borderWidth || 2}
          strokeDasharray={getStrokeDashArray()}
          markerEnd={arrowEnd ? `url(#arrowhead-end-${element.id})` : undefined}
          markerStart={arrowStart ? `url(#arrowhead-start-${element.id})` : undefined}
          className="pointer-events-auto cursor-pointer"
        />

        {/* Start point handle */}
        {isSelected && !element.locked && (
          <circle
            cx={localStartX}
            cy={localStartY}
            r="6"
            fill="white"
            stroke="#3B82F6"
            strokeWidth="2"
            className="pointer-events-auto cursor-move"
            onMouseDown={handleStartDrag}
            style={{ cursor: isDraggingStart ? 'grabbing' : 'grab' }}
          />
        )}

        {/* End point handle */}
        {isSelected && !element.locked && (
          <circle
            cx={localEndX}
            cy={localEndY}
            r="6"
            fill="white"
            stroke="#3B82F6"
            strokeWidth="2"
            className="pointer-events-auto cursor-move"
            onMouseDown={handleEndDrag}
            style={{ cursor: isDraggingEnd ? 'grabbing' : 'grab' }}
          />
        )}
      </svg>

      {/* Control Panel when selected */}
      {isSelected && !element.locked && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[1000] pointer-events-auto"
          style={{
            left: `${(startPoint.x + endPoint.x) / 2 - 80}px`,
            top: `${Math.min(startPoint.y, endPoint.y) - 50}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            {/* Arrow Start Toggle */}
            <button
              onClick={toggleArrowStart}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                arrowStart ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
              }`}
              title="Toggle start arrow"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Line Style Toggle */}
            <button
              onClick={toggleLineStyle}
              className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
              title={`Line style: ${lineStyle}`}
            >
              {lineStyle === 'solid' && <Minus className="w-4 h-4" />}
              {lineStyle === 'dashed' && <MoreVertical className="w-4 h-4 rotate-90" />}
              {lineStyle === 'dotted' && <MoreVertical className="w-4 h-4" />}
            </button>

            {/* Arrow End Toggle */}
            <button
              onClick={toggleArrowEnd}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                arrowEnd ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
              }`}
              title="Toggle end arrow"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
