/**
 * Column Component
 * Container for organizing elements vertically with a title
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import type { ColumnElement } from '../../types';
import { useElementStore, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import { Plus, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import CanvasElement from '../Canvas/CanvasElement';

interface ColumnProps {
  element: ColumnElement;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function Column({ element, isSelected, onSelect }: ColumnProps) {
  const { updateElement, getElementById, elements, selectElement, selectedIds } = useElementStore();
  const { draggedElementId, draggedFromColumnId, justFinishedDrag } = useDragStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(element.content.title || 'Untitled Column');
  const [isHovering, setIsHovering] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(element.content.collapsed || false);
  const prevDraggedElementIdRef = useRef<string | null>(null);
  const childRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted background color
  const backgroundColor = useDarkModeColor(element.style.backgroundColor || '#FFFFFF');

  const { handleMouseDown } = useDraggable({
    elementId: element.id
  });

  const { handleMouseDown: handleResizeMouseDownSE } = useResizable({
    elementId: element.id,
    minWidth: 250,
    minHeight: 150,
    maxWidth: 800,
    maxHeight: 2000,
    direction: 'se'
  });

  const { handleMouseDown: handleResizeMouseDownNW } = useResizable({
    elementId: element.id,
    minWidth: 250,
    minHeight: 150,
    maxWidth: 800,
    maxHeight: 2000,
    direction: 'nw'
  });

  const handleTitleChange = async () => {
    if (title.trim() === '') {
      setTitle('Untitled Column');
    }
    await updateElement(element.id, {
      content: {
        ...element.content,
        title: title.trim() || 'Untitled Column'
      }
    });
    setIsEditingTitle(false);
  };

  const handleToggleCollapse = async () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    await updateElement(element.id, {
      content: {
        ...element.content,
        collapsed: newCollapsed
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter key to edit title when selected
    if (e.key === 'Enter' && isSelected && !element.locked && !isEditingTitle) {
      e.preventDefault();
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 10);
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    // Don't drag when clicking on interactive elements
    const target = e.target as HTMLElement;

    // Allow dragging from title (but not when editing)
    const clickedOnInput = target.closest('input');
    const clickedOnButton = target.closest('button');
    const clickedOnChildElement = target.closest('.element-card') !== containerRef.current;

    if (clickedOnInput || clickedOnButton || clickedOnChildElement) {
      return;
    }

    // Prevent event from bubbling up
    e.stopPropagation();
    handleMouseDown(e);
  };

  // Handle drop zone hover
  const handleMouseEnter = () => {
    if (draggedElementId && draggedElementId !== element.id) {
      setIsHovering(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Keep hover state active while dragging over the zone
    if (draggedElementId && draggedElementId !== element.id) {
      if (!isHovering) {
        setIsHovering(true);
      }

      // Calculate drop index based on mouse position
      if (contentRef.current) {
        const contentRect = contentRef.current.getBoundingClientRect();
        const mouseX = e.clientX - contentRect.left;
        const mouseY = e.clientY - contentRect.top;

        // Get visible children (excluding the one being dragged)
        const visibleChildren = element.content.childrenIds.filter(id => id !== draggedElementId);

        let newDropIndex = visibleChildren.length; // Default to end

        // Check if we're in horizontal layout mode
        const isHorizontal = element.size.width >= 500;

        if (isHorizontal) {
          // Horizontal layout - calculate based on X position
          let currentX = 12; // Initial padding
          for (let i = 0; i < visibleChildren.length; i++) {
            const childRef = childRefs.current.get(visibleChildren[i]);
            if (childRef) {
              const childWidth = childRef.offsetWidth + 12; // Include gap
              const midPoint = currentX + childWidth / 2;

              if (mouseX < midPoint) {
                newDropIndex = i;
                break;
              }
              currentX += childWidth;
            }
          }
        } else {
          // Vertical layout - calculate based on Y position
          let currentY = 12; // Initial padding
          for (let i = 0; i < visibleChildren.length; i++) {
            const childRef = childRefs.current.get(visibleChildren[i]);
            if (childRef) {
              const childHeight = childRef.offsetHeight + 12; // Include margin
              const midPoint = currentY + childHeight / 2;

              if (mouseY < midPoint) {
                newDropIndex = i;
                break;
              }
              currentY += childHeight;
            }
          }
        }

        setDropIndex(newDropIndex);
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Only clear hover if we're actually leaving the drop zone
    // and not just because child elements changed
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && relatedTarget instanceof Node && contentRef.current?.contains(relatedTarget)) {
      // Mouse is still inside the drop zone
      return;
    }
    setIsHovering(false);
    setDropIndex(null);
  };

  // Focus container when selected for keyboard events
  useEffect(() => {
    if (isSelected && containerRef.current) {
      // Delay focus to allow double-click to register
      const timer = setTimeout(() => {
        if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
          containerRef.current.focus();
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  // Detect when drag ends and element is over this column
  useEffect(() => {
    // Drag just ended (draggedElementId went from something to null)
    if (prevDraggedElementIdRef.current && !draggedElementId) {
      const droppedElementId = prevDraggedElementIdRef.current;

      // Check if we were hovering over this column when drag ended
      if (isHovering) {
        const draggedElement = getElementById(droppedElementId);

        // Don't add columns to columns
        if (draggedElement && draggedElement.type !== 'column') {
          // Remove from previous column if needed
          if (draggedFromColumnId && draggedFromColumnId !== element.id) {
            const previousColumn = getElementById(draggedFromColumnId);
            if (previousColumn && previousColumn.type === 'column') {
              updateElement(draggedFromColumnId, {
                content: {
                  ...previousColumn.content,
                  childrenIds: previousColumn.content.childrenIds.filter(id => id !== droppedElementId)
                }
              });
            }
          }

          // Calculate new childrenIds with element at the correct position
          let newChildrenIds = element.content.childrenIds.filter(id => id !== droppedElementId);
          const insertAt = dropIndex !== null ? dropIndex : newChildrenIds.length;
          newChildrenIds.splice(insertAt, 0, droppedElementId);

          // Update this column with reordered children
          updateElement(element.id, {
            content: {
              ...element.content,
              childrenIds: newChildrenIds
            }
          });
        }

        setIsHovering(false);
        setDropIndex(null);
      }

      // ALWAYS check if we need to remove the element from THIS column
      // This happens when the element is dragged out to the canvas or to another column
      if (element.content.childrenIds.includes(droppedElementId) && !isHovering) {
        // Remove from this column
        updateElement(element.id, {
          content: {
            ...element.content,
            childrenIds: element.content.childrenIds.filter(id => id !== droppedElementId)
          }
        });
      }
    }

    // Update the ref for next comparison
    prevDraggedElementIdRef.current = draggedElementId;
  }, [draggedElementId, draggedFromColumnId, isHovering, dropIndex, element.content.childrenIds, element.id, getElementById, updateElement]);

  // Get child elements
  const childElements = elements.filter(el =>
    element.content.childrenIds.includes(el.id)
  );

  // Determine layout mode based on column width
  const isHorizontalLayout = element.size.width >= 500;

  return (
    <div
      ref={containerRef}
      className={`
        element-card absolute border-2 border-gray-300 dark:border-gray-600
        ${isSelected ? 'selected ring-2 ring-primary-500 border-primary-400 dark:border-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : 'cursor-move'}
      `}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        minHeight: isCollapsed ? 'auto' : `${element.size.height}px`,
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
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 p-3 flex items-center gap-2">
        {/* Collapse toggle button */}
        <button
          className="p-1 -ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleCollapse();
          }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>
        {/* Grip handle for dragging - visual indicator */}
        <div className="p-1 -ml-1">
          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
        {/* Title */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTitleChange();
              } else if (e.key === 'Escape') {
                setTitle(element.content.title || 'Untitled Column');
                setIsEditingTitle(false);
              }
              e.stopPropagation();
            }}
            autoFocus
            className="flex-1 px-2 py-1 border border-primary-300 dark:border-primary-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="flex-1 font-semibold text-gray-900 dark:text-gray-100 cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (isSelected && !element.locked) {
                setIsEditingTitle(true);
              }
            }}
          >
            {element.content.title || 'Untitled Column'}
          </h3>
        )}

        {/* Add button */}
        {isSelected && (
          <button
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Add element"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement add element to column
            }}
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Content Area - Child Elements */}
      {!isCollapsed && (
        <div
          ref={contentRef}
          className={`
            p-3 min-h-[100px] transition-colors
            ${isHorizontalLayout ? 'flex flex-wrap gap-3' : 'space-y-3'}
            ${isHovering && draggedElementId ? 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-inset ring-primary-300 dark:ring-primary-600' : ''}
          `}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
        {childElements.length === 0 ? (
          <div className={`
            flex items-center justify-center h-24 w-full border-2 border-dashed rounded text-sm transition-colors
            ${isHovering && draggedElementId ? 'border-primary-400 text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'}
          `}>
            Drag elements here or click + to add
          </div>
        ) : (
          <div className={`relative ${isHorizontalLayout ? 'flex flex-wrap gap-3 items-start' : ''}`}>
            {element.content.childrenIds
              .map((childId, index) => {
                const child = childElements.find(el => el.id === childId);
                if (!child) return null;

                const isBeingDraggedChild = childId === draggedElementId;
                // Calculate the visual index (excluding dragged element)
                const visualIndex = element.content.childrenIds
                  .slice(0, index)
                  .filter(id => id !== draggedElementId).length;

                return (
                  <div key={child.id} className={isHorizontalLayout ? 'flex items-stretch' : ''}>
                    {/* Drop indicator before this element */}
                    {isHovering && dropIndex === visualIndex && !isBeingDraggedChild && (
                      <div className={`bg-primary-500 rounded-full animate-pulse ${isHorizontalLayout ? 'w-1 mr-3' : 'h-1 mb-4'}`} />
                    )}
                    <div
                      ref={(el) => {
                        if (el) {
                          childRefs.current.set(child.id, el);
                        } else {
                          childRefs.current.delete(child.id);
                        }
                      }}
                      className={`${isHorizontalLayout ? '' : 'mb-4 last:mb-0'} ${isBeingDraggedChild ? 'invisible h-0 overflow-hidden' : ''}`}
                      style={{
                        // Override absolute positioning for children in column
                        position: 'relative',
                        left: 0,
                        top: 0
                      }}
                    >
                      <CanvasElement
                        element={child}
                        isSelected={selectedIds.includes(child.id)}
                        onSelect={() => selectElement(child.id)}
                        parentColumnId={element.id}
                      />
                    </div>
                  </div>
                );
              })}
            {/* Drop indicator at the end */}
            {isHovering && dropIndex === element.content.childrenIds.filter(id => id !== draggedElementId).length && (
              <div className={`bg-primary-500 rounded-full animate-pulse ${isHorizontalLayout ? 'w-1 self-stretch' : 'h-1'}`} />
            )}
          </div>
        )}
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
