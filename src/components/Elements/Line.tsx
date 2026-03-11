/**
 * Line Component
 * Drawable line/arrow for connecting elements or freeform annotations
 */

import { useRef, useState, useEffect } from 'react';
import type { LineElement } from '../../types';
import { useElementStore, selectElements, useUIStore, selectZoom, selectPanX, selectPanY, useDragStore } from '../../store';

interface LineProps {
  element: LineElement;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function Line({ element, isSelected, onSelect: _onSelect }: LineProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const elements = useElementStore(selectElements);
  const zoom = useUIStore(selectZoom);
  const panX = useUIStore(selectPanX);
  const panY = useUIStore(selectPanY);
  const draggedElementId = useDragStore(state => state.draggedElementId);
  const justFinishedDrag = useDragStore(state => state.justFinishedDrag);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [, setIsDraggingLine] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(element.content.label || '');

  // Check if this element is currently being dragged
  const isBeingDragged = draggedElementId === element.id;

  // Handle Enter key to edit title
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && e.key === 'Enter' && !isEditingTitle) {
        e.preventDefault();
        setIsEditingTitle(true);
        setTitleValue(element.content.label || '');
      }
    };

    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelected, isEditingTitle, element.content.label]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    const trimmedValue = titleValue.trim();
    updateElement(element.id, {
      content: {
        ...element.content,
        label: trimmedValue || undefined
      }
    });
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitleValue(element.content.label || '');
    }
  };

  // Helper function to find element at position
  const findElementAtPosition = (x: number, y: number): string | null => {
    const otherElements = elements.filter(el => el.type !== 'line' && el.id !== element.id);

    for (const el of otherElements) {
      const elLeft = el.position.x;
      const elTop = el.position.y;
      const elRight = elLeft + el.size.width;
      const elBottom = elTop + el.size.height;

      if (x >= elLeft && x <= elRight && y >= elTop && y <= elBottom) {
        return el.id;
      }
    }
    return null;
  };

  // Helper function to get connection point for an element
  const getConnectionPoint = (elementId: string) => {
    const targetElement = elements.find(el => el.id === elementId);
    if (!targetElement) return null;

    const parentColumn = elements.find(
      el => el.type === 'column' && el.content.childrenIds?.includes(elementId)
    );

    if (parentColumn) {
      return {
        x: parentColumn.position.x + parentColumn.size.width / 2,
        y: parentColumn.position.y + parentColumn.size.height / 2
      };
    } else {
      return {
        x: targetElement.position.x + targetElement.size.width / 2,
        y: targetElement.position.y + targetElement.size.height / 2
      };
    }
  };

  const startPoint = element.content.startPoint;
  const endPoint = element.content.endPoint;
  const lineStyle = element.content.lineStyle || 'solid';
  const arrowStart = element.content.arrowStart ?? false;
  const arrowEnd = element.content.arrowEnd ?? true;

  // Calculate bounding box
  const minX = Math.min(startPoint.x, endPoint.x);
  const minY = Math.min(startPoint.y, endPoint.y);
  const maxX = Math.max(startPoint.x, endPoint.x);
  const maxY = Math.max(startPoint.y, endPoint.y);
  const padding = 20;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  // Local coordinates within SVG
  const localStartX = startPoint.x - minX + padding;
  const localStartY = startPoint.y - minY + padding;
  const localEndX = endPoint.x - minX + padding;
  const localEndY = endPoint.y - minY + padding;

  // Custom drag handler for line (moves both points)
  const handleLineDrag = (e: React.MouseEvent) => {
    // Always stop propagation to prevent canvas from clearing selection
    e.stopPropagation();

    if (element.locked || isDraggingStart || isDraggingEnd) return;

    // Only start drag on left click
    if (e.button !== 0) return;

    e.preventDefault();

    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    const initialStartPoint = { ...startPoint };
    const initialEndPoint = { ...endPoint };
    let hasMoved = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();

      const deltaX = (moveEvent.clientX - mouseStartX) / zoom;
      const deltaY = (moveEvent.clientY - mouseStartY) / zoom;

      // Start drag after small movement
      if (!hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
        hasMoved = true;
        setIsDraggingLine(true);
        useDragStore.getState().setDraggedElement(element.id, null);
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      if (!hasMoved) return;

      updateElement(element.id, {
        content: {
          ...element.content,
          // Disconnect from any attached elements when dragging freely
          startElementId: undefined,
          endElementId: undefined,
          startPoint: {
            x: initialStartPoint.x + deltaX,
            y: initialStartPoint.y + deltaY
          },
          endPoint: {
            x: initialEndPoint.x + deltaX,
            y: initialEndPoint.y + deltaY
          }
        }
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (hasMoved) {
        useDragStore.getState().setJustFinishedDrag(true);
        setTimeout(() => useDragStore.getState().setJustFinishedDrag(false), 100);
      }

      setIsDraggingLine(false);
      useDragStore.getState().clearDrag();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (justFinishedDrag) {
      return;
    }

    const isMultiSelect = e.ctrlKey || e.metaKey;
    const { selectElement } = useElementStore.getState();
    selectElement(element.id, isMultiSelect);
  };

  const handleStartDrag = (e: React.MouseEvent) => {
    if (element.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingStart(true);

    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    const initialPoint = { ...startPoint };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();

      const deltaX = (moveEvent.clientX - mouseStartX) / zoom;
      const deltaY = (moveEvent.clientY - mouseStartY) / zoom;

      updateElement(element.id, {
        content: {
          ...element.content,
          startPoint: { x: initialPoint.x + deltaX, y: initialPoint.y + deltaY }
        }
      });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDraggingStart(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const rect = document.body.getBoundingClientRect();
      const finalX = (upEvent.clientX - rect.left) / zoom - panX;
      const finalY = (upEvent.clientY - rect.top) / zoom - panY;

      const targetElementId = findElementAtPosition(finalX, finalY);

      if (targetElementId) {
        const connectionPoint = getConnectionPoint(targetElementId);
        if (connectionPoint) {
          updateElement(element.id, {
            content: {
              ...element.content,
              startPoint: connectionPoint,
              startElementId: targetElementId
            }
          });
        }
      } else {
        updateElement(element.id, {
          content: {
            ...element.content,
            startElementId: undefined
          }
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleEndDrag = (e: React.MouseEvent) => {
    if (element.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingEnd(true);

    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    const initialPoint = { ...endPoint };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();

      const deltaX = (moveEvent.clientX - mouseStartX) / zoom;
      const deltaY = (moveEvent.clientY - mouseStartY) / zoom;

      updateElement(element.id, {
        content: {
          ...element.content,
          endPoint: { x: initialPoint.x + deltaX, y: initialPoint.y + deltaY }
        }
      });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDraggingEnd(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const rect = document.body.getBoundingClientRect();
      const finalX = (upEvent.clientX - rect.left) / zoom - panX;
      const finalY = (upEvent.clientY - rect.top) / zoom - panY;

      const targetElementId = findElementAtPosition(finalX, finalY);

      if (targetElementId) {
        const connectionPoint = getConnectionPoint(targetElementId);
        if (connectionPoint) {
          updateElement(element.id, {
            content: {
              ...element.content,
              endPoint: connectionPoint,
              endElementId: targetElementId
            }
          });
        }
      } else {
        updateElement(element.id, {
          content: {
            ...element.content,
            endElementId: undefined
          }
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
    <div
      ref={containerRef}
      data-element-id={element.id}
      className={`
        element-card absolute
        ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
        ${element.locked ? 'cursor-not-allowed' : 'cursor-move'}
      `}
      style={{
        left: `${minX - padding}px`,
        top: `${minY - padding}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: element.zIndex,
        pointerEvents: isBeingDragged ? 'none' : 'auto',
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: 0
      }}
      onClick={handleClick}
      onMouseDown={handleLineDrag}
    >
      <svg
        width={width}
        height={height}
        className="w-full h-full"
        style={{ overflow: 'visible' }}
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

        {/* Main visible line */}
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
          style={{ pointerEvents: 'none' }}
        />

        {/* Invisible thicker line for easier clicking */}
        <line
          x1={localStartX}
          y1={localStartY}
          x2={localEndX}
          y2={localEndY}
          stroke="transparent"
          strokeWidth="16"
          style={{ pointerEvents: 'stroke' }}
        />

        {/* Start point handle */}
        {isSelected && !element.locked && (
          <g
            style={{ cursor: isDraggingStart ? 'grabbing' : 'grab' }}
            onMouseDown={handleStartDrag}
          >
            <circle
              cx={localStartX}
              cy={localStartY}
              r="12"
              fill="transparent"
            />
            <circle
              cx={localStartX}
              cy={localStartY}
              r="6"
              fill="white"
              stroke="#3B82F6"
              strokeWidth="2"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        )}

        {/* End point handle */}
        {isSelected && !element.locked && (
          <g
            style={{ cursor: isDraggingEnd ? 'grabbing' : 'grab' }}
            onMouseDown={handleEndDrag}
          >
            <circle
              cx={localEndX}
              cy={localEndY}
              r="12"
              fill="transparent"
            />
            <circle
              cx={localEndX}
              cy={localEndY}
              r="6"
              fill="white"
              stroke="#3B82F6"
              strokeWidth="2"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        )}
      </svg>

      {/* Title label - shown at middle of line */}
      {(element.content.label || isEditingTitle) && (
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
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleSubmit}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[60px]"
              placeholder="Label"
            />
          ) : (
            <span
              className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
                setTitleValue(element.content.label || '');
              }}
            >
              {element.content.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
