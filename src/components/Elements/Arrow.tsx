/**
 * Arrow Component
 * Smart connector with anchor points, curved/elbow paths, and advanced styling
 */

import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import type { ArrowElement, Position, AnchorPosition, Element } from '../../types';
import { useElementStore, selectElements, useDragStore } from '../../store';

interface ArrowProps {
  element: ArrowElement;
  isSelected?: boolean;
}

// Calculate anchor point position on an element
function getAnchorPoint(element: Element, anchor: AnchorPosition): Position {
  const { position, size } = element;
  const { x, y } = position;
  const { width, height } = size;

  switch (anchor) {
    case 'top':
      return { x: x + width / 2, y };
    case 'top-right':
      return { x: x + width, y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom-right':
      return { x: x + width, y: y + height };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'bottom-left':
      return { x, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'top-left':
      return { x, y };
    case 'center':
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
}

// Generate curved path (Bézier)
function generateCurvedPath(start: Position, end: Position, startAnchor: AnchorPosition, endAnchor: AnchorPosition): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Control point offset (30% of distance, minimum 50px)
  const offset = Math.max(50, distance * 0.3);

  // Calculate control points based on anchor positions
  let cp1x = start.x;
  let cp1y = start.y;
  let cp2x = end.x;
  let cp2y = end.y;

  // Start control point
  if (startAnchor.includes('top')) cp1y -= offset;
  else if (startAnchor.includes('bottom')) cp1y += offset;
  if (startAnchor.includes('left')) cp1x -= offset;
  else if (startAnchor.includes('right')) cp1x += offset;

  // End control point
  if (endAnchor.includes('top')) cp2y -= offset;
  else if (endAnchor.includes('bottom')) cp2y += offset;
  if (endAnchor.includes('left')) cp2x -= offset;
  else if (endAnchor.includes('right')) cp2x += offset;

  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

// Generate elbow/orthogonal path (right angles)
function generateElbowPath(start: Position, end: Position, startAnchor: AnchorPosition, _endAnchor: AnchorPosition): string {
  const path: string[] = [`M ${start.x} ${start.y}`];

  // Determine primary direction from start anchor
  const isHorizontalStart = startAnchor === 'left' || startAnchor === 'right';
  const isVerticalStart = startAnchor === 'top' || startAnchor === 'bottom';

  if (isHorizontalStart) {
    // Exit horizontally
    const exitLength = Math.abs(end.x - start.x) / 2;
    const exitX = startAnchor === 'right' ? start.x + exitLength : start.x - exitLength;
    path.push(`L ${exitX} ${start.y}`);
    path.push(`L ${exitX} ${end.y}`);
    path.push(`L ${end.x} ${end.y}`);
  } else if (isVerticalStart) {
    // Exit vertically
    const exitLength = Math.abs(end.y - start.y) / 2;
    const exitY = startAnchor === 'bottom' ? start.y + exitLength : start.y - exitLength;
    path.push(`L ${start.x} ${exitY}`);
    path.push(`L ${end.x} ${exitY}`);
    path.push(`L ${end.x} ${end.y}`);
  } else {
    // Fallback to simple L shape
    path.push(`L ${end.x} ${start.y}`);
    path.push(`L ${end.x} ${end.y}`);
  }

  return path.join(' ');
}

// Generate straight path
function generateStraightPath(start: Position, end: Position): string {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

const Arrow = memo(function Arrow({ element, isSelected }: ArrowProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const elements = useElementStore(selectElements);
  const selectElement = useElementStore(state => state.selectElement);
  const justFinishedDrag = useDragStore(state => state.justFinishedDrag);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(element.content.label || '');
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Find connected elements
  const startElement = elements.find(el => el.id === element.content.startElementId);
  const endElement = elements.find(el => el.id === element.content.endElementId);

  // If connected elements don't exist, don't render
  if (!startElement || !endElement) {
    return null;
  }

  // Calculate anchor points
  const startPoint = getAnchorPoint(startElement, element.content.startAnchor);
  const endPoint = getAnchorPoint(endElement, element.content.endAnchor);

  // Generate path based on pathType
  const path = useMemo(() => {
    switch (element.content.pathType) {
      case 'curved':
        return generateCurvedPath(startPoint, endPoint, element.content.startAnchor, element.content.endAnchor);
      case 'elbow':
      case 'step':
        return generateElbowPath(startPoint, endPoint, element.content.startAnchor, element.content.endAnchor);
      case 'straight':
      default:
        return generateStraightPath(startPoint, endPoint);
    }
  }, [startPoint, endPoint, element.content.pathType, element.content.startAnchor, element.content.endAnchor]);

  // Calculate bounding box
  const minX = Math.min(startPoint.x, endPoint.x);
  const minY = Math.min(startPoint.y, endPoint.y);
  const maxX = Math.max(startPoint.x, endPoint.x);
  const maxY = Math.max(startPoint.y, endPoint.y);
  const padding = 30;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  // Local coordinates within SVG
  const localStartX = startPoint.x - minX + padding;
  const localStartY = startPoint.y - minY + padding;
  const localEndX = endPoint.x - minX + padding;
  const localEndY = endPoint.y - minY + padding;

  // Translate path to local coordinates
  const localPath = useMemo(() => path
    .replace(/M ([\d.-]+) ([\d.-]+)/g, (_, x, y) =>
      `M ${parseFloat(x) - minX + padding} ${parseFloat(y) - minY + padding}`)
    .replace(/L ([\d.-]+) ([\d.-]+)/g, (_, x, y) =>
      `L ${parseFloat(x) - minX + padding} ${parseFloat(y) - minY + padding}`)
    .replace(/C ([\d.-]+) ([\d.-]+), ([\d.-]+) ([\d.-]+), ([\d.-]+) ([\d.-]+)/g,
      (_, x1, y1, x2, y2, x3, y3) =>
        `C ${parseFloat(x1) - minX + padding} ${parseFloat(y1) - minY + padding}, ${parseFloat(x2) - minX + padding} ${parseFloat(y2) - minY + padding}, ${parseFloat(x3) - minX + padding} ${parseFloat(y3) - minY + padding}`),
  [path, minX, minY, padding]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (justFinishedDrag) return;

    const isMultiSelect = e.ctrlKey || e.metaKey;
    selectElement(element.id, isMultiSelect);
  };

  const handleLabelSubmit = () => {
    const trimmedValue = labelValue.trim();
    updateElement(element.id, {
      content: {
        ...element.content,
        label: trimmedValue || undefined
      }
    });
    setIsEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingLabel(false);
      setLabelValue(element.content.label || '');
    }
  };

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  // Get stroke dash array
  const getStrokeDashArray = () => {
    switch (element.content.lineStyle) {
      case 'dashed':
        return '10,5';
      case 'dotted':
        return '2,3';
      default:
        return 'none';
    }
  };

  const color = element.content.color || element.style.borderColor || '#3B82F6';
  const thickness = element.content.thickness || element.style.borderWidth || 2;
  const arrowHeadEnd = element.content.arrowHeadEnd || 'triangle-filled';
  const arrowHeadStart = element.content.arrowHeadStart || 'none';

  return (
    <div
      data-element-id={element.id}
      className={`
        element-card absolute pointer-events-none
        ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
      `}
      style={{
        left: `${minX - padding}px`,
        top: `${minY - padding}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: element.zIndex,
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: 0
      }}
      onClick={handleClick}
    >
      <svg
        width={width}
        height={height}
        className="w-full h-full pointer-events-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Arrow marker for end */}
          {arrowHeadEnd !== 'none' && (
            <marker
              id={`arrow-end-${element.id}`}
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              {arrowHeadEnd === 'triangle-filled' && (
                <path d="M0,0 L0,6 L9,3 z" fill={color} />
              )}
              {arrowHeadEnd === 'triangle' && (
                <path d="M0,0 L0,6 L9,3 z" fill="none" stroke={color} strokeWidth="1" />
              )}
              {arrowHeadEnd === 'diamond' && (
                <path d="M0,3 L4.5,0 L9,3 L4.5,6 z" fill={color} />
              )}
              {arrowHeadEnd === 'circle' && (
                <circle cx="4.5" cy="3" r="3" fill={color} />
              )}
              {arrowHeadEnd === 'bar' && (
                <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2" />
              )}
            </marker>
          )}

          {/* Arrow marker for start */}
          {arrowHeadStart !== 'none' && (
            <marker
              id={`arrow-start-${element.id}`}
              markerWidth="10"
              markerHeight="10"
              refX="0"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              {arrowHeadStart === 'triangle-filled' && (
                <path d="M9,0 L9,6 L0,3 z" fill={color} />
              )}
              {arrowHeadStart === 'triangle' && (
                <path d="M9,0 L9,6 L0,3 z" fill="none" stroke={color} strokeWidth="1" />
              )}
              {arrowHeadStart === 'diamond' && (
                <path d="M0,3 L4.5,0 L9,3 L4.5,6 z" fill={color} />
              )}
              {arrowHeadStart === 'circle' && (
                <circle cx="4.5" cy="3" r="3" fill={color} />
              )}
              {arrowHeadStart === 'bar' && (
                <line x1="9" y1="0" x2="9" y2="6" stroke={color} strokeWidth="2" />
              )}
            </marker>
          )}

          {/* Animation for flow */}
          {element.content.animated && (
            <style>
              {`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
                .animated-arrow-${element.id} {
                  animation: dash 1s linear infinite;
                }
              `}
            </style>
          )}
        </defs>

        {/* Main path */}
        <path
          d={localPath}
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={element.content.animated ? '5,5' : getStrokeDashArray()}
          fill="none"
          markerEnd={arrowHeadEnd !== 'none' ? `url(#arrow-end-${element.id})` : undefined}
          markerStart={arrowHeadStart !== 'none' ? `url(#arrow-start-${element.id})` : undefined}
          className={element.content.animated ? `animated-arrow-${element.id}` : ''}
          style={{ pointerEvents: 'none' }}
        />

        {/* Invisible thicker path for easier clicking */}
        <path
          d={localPath}
          stroke="transparent"
          strokeWidth="20"
          fill="none"
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        />

        {/* Anchor point handles (shown when selected) */}
        {isSelected && !element.locked && (
          <>
            {/* Start handle */}
            <circle
              cx={localStartX}
              cy={localStartY}
              r="8"
              fill="white"
              stroke="#3B82F6"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-100"
              style={{ pointerEvents: 'auto' }}
            />
            {/* End handle */}
            <circle
              cx={localEndX}
              cy={localEndY}
              r="8"
              fill="white"
              stroke="#3B82F6"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-100"
              style={{ pointerEvents: 'auto' }}
            />
          </>
        )}
      </svg>

      {/* Label at midpoint */}
      {(element.content.label || isEditingLabel) && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: `${(localStartX + localEndX) / 2}px`,
            top: `${(localStartY + localEndY) / 2}px`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onKeyDown={handleLabelKeyDown}
              onBlur={handleLabelSubmit}
              className="px-2 py-1 text-xs bg-white dark:bg-[#1E252B] border border-blue-400 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[60px]"
              placeholder="Label"
            />
          ) : (
            <div
              className="px-2 py-1 text-xs font-medium bg-white dark:bg-[#1E252B] border border-gray-300 dark:border-[#3D444D] rounded shadow-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-[#252B32] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingLabel(true);
                setLabelValue(element.content.label || '');
              }}
              style={{ color }}
            >
              {element.content.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default Arrow;
