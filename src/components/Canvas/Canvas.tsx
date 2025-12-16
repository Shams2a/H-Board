/**
 * Canvas Component
 * Main workspace for placing and manipulating elements
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { useBoardStore, useElementStore, useUIStore, useDragStore, useArrowConnectionStore } from '../../store';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import { newSyncService } from '../../services/supabase/newSyncService';
import CanvasElement from './CanvasElement';
import AnchorPoints from '../Elements/AnchorPoints';
import { ContextMenu } from '../ContextMenu';
import KanbanBoard from '../Kanban/KanbanBoard';
import DatabaseBoard from '../Database/DatabaseBoard';
import type { AnchorPosition, ArrowElement, Position } from '../../types';

// Virtual canvas size (how far users can scroll)
const CANVAS_VIRTUAL_WIDTH = 10000;
const CANVAS_VIRTUAL_HEIGHT = 10000;

interface CanvasProps {
  onExport?: () => void;
}

export default function Canvas({ onExport }: CanvasProps = {}) {
  const { currentBoardId, getCurrentBoard } = useBoardStore();
  const {
    loadElements,
    elements,
    createElement,
    selectElement,
    selectedIds,
    clearSelection,
    deleteElements,
    undo,
    redo
  } = useElementStore();
  const { zoom, panX, panY, gridEnabled, setPan, activeTool, setActiveTool } = useUIStore();
  const { draggedElementId, justFinishedDrag } = useDragStore();
  const { startConnection, completeConnection } = useArrowConnectionStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [didSelect, setDidSelect] = useState(false);

  // Scrollbar dragging state
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState<'horizontal' | 'vertical' | null>(null);
  const [scrollbarDragStart, setScrollbarDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  // Track if we're currently interacting (panning/scrolling) to disable transition
  const [isInteracting, setIsInteracting] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    canvasPosition: { x: number; y: number };
  } | null>(null);

  const currentBoard = getCurrentBoard();

  // Get dark mode adapted canvas background color
  const canvasBackgroundColor = useDarkModeColor(
    currentBoard?.settings.backgroundColor || '#F5F5F5'
  );

  // Calculate scrollbar dimensions
  // Optimized: removed 'elements' dependency as scrollbars only depend on zoom and pan
  const scrollbarInfo = useMemo(() => {
    const containerWidth = canvasRef.current?.clientWidth || 800;
    const containerHeight = canvasRef.current?.clientHeight || 600;

    // Visible area in canvas coordinates
    const visibleWidth = containerWidth / zoom;
    const visibleHeight = containerHeight / zoom;

    // Scrollbar thumb size (proportion of visible area to total canvas)
    const hThumbWidth = Math.max(30, (visibleWidth / CANVAS_VIRTUAL_WIDTH) * containerWidth);
    const vThumbHeight = Math.max(30, (visibleHeight / CANVAS_VIRTUAL_HEIGHT) * containerHeight);

    // Scrollbar thumb position
    // Pan values are negative when scrolled, so we negate them
    const maxPanX = CANVAS_VIRTUAL_WIDTH - visibleWidth;
    const maxPanY = CANVAS_VIRTUAL_HEIGHT - visibleHeight;

    const hThumbPosition = maxPanX > 0 ? ((-panX) / maxPanX) * (containerWidth - hThumbWidth) : 0;
    const vThumbPosition = maxPanY > 0 ? ((-panY) / maxPanY) * (containerHeight - vThumbHeight) : 0;

    return {
      containerWidth,
      containerHeight,
      hThumbWidth,
      vThumbHeight,
      hThumbPosition: Math.max(0, Math.min(hThumbPosition, containerWidth - hThumbWidth)),
      vThumbPosition: Math.max(0, Math.min(vThumbPosition, containerHeight - vThumbHeight)),
      maxPanX,
      maxPanY
    };
  }, [zoom, panX, panY]);

  // Handle scrollbar mouse down
  const handleScrollbarMouseDown = (type: 'horizontal' | 'vertical') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingScrollbar(type);
    setIsInteracting(true); // Disable transition during scrollbar drag
    setScrollbarDragStart({
      x: e.clientX,
      y: e.clientY,
      panX,
      panY
    });
  };

  // Handle scrollbar dragging
  useEffect(() => {
    if (!isDraggingScrollbar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { containerWidth, containerHeight, hThumbWidth, vThumbHeight, maxPanX, maxPanY } = scrollbarInfo;

      if (isDraggingScrollbar === 'horizontal') {
        const deltaX = e.clientX - scrollbarDragStart.x;
        const trackWidth = containerWidth - hThumbWidth;
        const panDelta = trackWidth > 0 ? (deltaX / trackWidth) * maxPanX : 0;
        const newPanX = Math.max(-maxPanX, Math.min(0, scrollbarDragStart.panX - panDelta));
        setPan(newPanX, panY);
      } else {
        const deltaY = e.clientY - scrollbarDragStart.y;
        const trackHeight = containerHeight - vThumbHeight;
        const panDelta = trackHeight > 0 ? (deltaY / trackHeight) * maxPanY : 0;
        const newPanY = Math.max(-maxPanY, Math.min(0, scrollbarDragStart.panY - panDelta));
        setPan(panX, newPanY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingScrollbar(null);
      setIsInteracting(false); // Re-enable transition after scrollbar drag ends
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingScrollbar, scrollbarDragStart, scrollbarInfo, panX, panY, setPan]);

  // Handle scrollbar track click
  const handleScrollbarTrackClick = (type: 'horizontal' | 'vertical') => (e: React.MouseEvent) => {
    e.stopPropagation();
    const { containerWidth, containerHeight, hThumbWidth, vThumbHeight, maxPanX, maxPanY } = scrollbarInfo;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    if (type === 'horizontal') {
      const clickX = e.clientX - rect.left;
      const trackWidth = containerWidth - hThumbWidth;
      const ratio = trackWidth > 0 ? clickX / containerWidth : 0;
      const newPanX = -ratio * maxPanX;
      setPan(Math.max(-maxPanX, Math.min(0, newPanX)), panY);
    } else {
      const clickY = e.clientY - rect.top;
      const trackHeight = containerHeight - vThumbHeight;
      const ratio = trackHeight > 0 ? clickY / containerHeight : 0;
      const newPanY = -ratio * maxPanY;
      setPan(panX, Math.max(-maxPanY, Math.min(0, newPanY)));
    }
  };

  useEffect(() => {
    if (currentBoardId) {
      loadElements(currentBoardId);
    }
  }, [currentBoardId, loadElements]);

  // Refresh elements when sync downloads new data
  useEffect(() => {
    const unsubscribe = newSyncService.onSyncComplete((hasNewData) => {
      if (hasNewData && currentBoardId) {
        loadElements(currentBoardId);
      }
    });
    return unsubscribe;
  }, [currentBoardId, loadElements]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('.ProseMirror');

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (isTyping) return;
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        if (isTyping) return;
        e.preventDefault();
        redo();
        return;
      }

      // Delete or Backspace key to delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (isTyping) return;

        e.preventDefault();
        deleteElements(selectedIds);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteElements, undo, redo]);

  // Handle mouse wheel for panning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let wheelTimeout: number;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scroll behavior
      e.preventDefault();

      // Disable transition during panning for better performance
      setIsInteracting(true);

      // Panning speed factor (adjust as needed)
      const panSpeed = 1;

      // Calculate new pan values
      // deltaY for vertical scroll, deltaX for horizontal scroll
      // Shift+wheel can also trigger horizontal scroll in some browsers
      const deltaX = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const deltaY = e.shiftKey ? 0 : e.deltaY;

      const newPanX = panX - deltaX * panSpeed;
      const newPanY = panY - deltaY * panSpeed;

      setPan(newPanX, newPanY);

      // Re-enable transition after panning stops
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        setIsInteracting(false);
      }, 150);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [panX, panY, setPan]);

  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't clear selection if we just finished a selection box
    if (didSelect) {
      setDidSelect(false);
      return;
    }

    // Don't clear selection if we just finished dragging
    if (justFinishedDrag) {
      return;
    }

    // Only handle click if NOT clicking on an element
    const target = e.target as HTMLElement;
    if (target.closest('.element-card')) return;

    // Clear selection when clicking on empty canvas
    clearSelection();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start selection box if NOT clicking on an element
    const target = e.target as HTMLElement;
    if (target.closest('.element-card')) return;

    // Don't start selection box if right-clicking
    if (e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate position relative to canvas, accounting for zoom and pan
    const x = (e.clientX - rect.left) / zoom - panX;
    const y = (e.clientY - rect.top) / zoom - panY;

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
    setDidSelect(false); // Reset flag

    // Clear selection if not holding Ctrl/Cmd
    if (!e.ctrlKey && !e.metaKey) {
      clearSelection();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate position relative to canvas, accounting for zoom and pan
    const x = (e.clientX - rect.left) / zoom - panX;
    const y = (e.clientY - rect.top) / zoom - panY;

    setSelectionEnd({ x, y });

    // Calculate selection box bounds
    const minX = Math.min(selectionStart.x, x);
    const maxX = Math.max(selectionStart.x, x);
    const minY = Math.min(selectionStart.y, y);
    const maxY = Math.max(selectionStart.y, y);

    // Find elements within selection box
    elements.forEach((element) => {
      const elX = element.position.x;
      const elY = element.position.y;
      const elRight = elX + element.size.width;
      const elBottom = elY + element.size.height;

      // Check if element intersects with selection box
      const intersects = !(elRight < minX || elX > maxX || elBottom < minY || elY > maxY);

      if (intersects && !selectedIds.includes(element.id)) {
        selectElement(element.id, true); // multi-select mode
        setDidSelect(true); // Mark that we selected something
      }
    });
  };

  const handleCanvasMouseUp = () => {
    setIsSelecting(false);
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate position in canvas coordinates
    // Transform is: scale(zoom) translate(panX, panY)
    // So: screenPos = (canvasPos + pan) * zoom
    // Therefore: canvasPos = screenPos / zoom - pan
    const canvasX = (e.clientX - rect.left) / zoom - panX;
    const canvasY = (e.clientY - rect.top) / zoom - panY;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasPosition: { x: canvasX, y: canvasY }
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Handle anchor point click for arrow connections
  const handleAnchorClick = async (elementId: string, anchor: AnchorPosition) => {
    if (activeTool !== 'arrow') return;

    // First click - start connection
    const connectionData = completeConnection(elementId, anchor);

    if (!connectionData) {
      // This is the first click
      startConnection(elementId, anchor);
      return;
    }

    // Second click - create arrow
    const maxZ = Math.max(0, ...elements.map(el => el.zIndex));

    const newArrow: ArrowElement = {
      id: crypto.randomUUID(),
      boardId: currentBoardId!,
      type: 'arrow',
      position: { x: 0, y: 0 }, // Will be calculated from connected elements
      size: { width: 100, height: 100 }, // Will be calculated from path bounds
      zIndex: maxZ + 1,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      style: {
        borderColor: '#9CA3AF',
        borderWidth: 2
      },
      content: {
        startElementId: connectionData.startElementId,
        endElementId: connectionData.endElementId,
        startAnchor: connectionData.startAnchor,
        endAnchor: connectionData.endAnchor,
        pathType: 'curved', // Default to curved, can be changed via customization panel
        lineStyle: 'solid',
        arrowHeadEnd: 'triangle-filled',
        arrowHeadStart: 'none',
        color: '#9CA3AF',
        thickness: 2
      }
    };

    await createElement(newArrow);

    // Deactivate arrow tool after creation
    setActiveTool(null);
  };

  if (!currentBoard) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background-canvas">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Welcome to H-Board
          </h2>
          <p className="text-text-secondary">
            Create a new board or select one from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  // Route to Kanban board if type is 'kanban'
  if (currentBoard.type === 'kanban') {
    return <KanbanBoard boardId={currentBoardId!} />;
  }

  // Route to Database board if type is 'database'
  if (currentBoard.type === 'database') {
    return <DatabaseBoard boardId={currentBoardId!} />;
  }

  // Calculate selection box dimensions for rendering
  const selectionBox = isSelecting ? {
    left: Math.min(selectionStart.x, selectionEnd.x),
    top: Math.min(selectionStart.y, selectionEnd.y),
    width: Math.abs(selectionEnd.x - selectionStart.x),
    height: Math.abs(selectionEnd.y - selectionStart.y)
  } : null;

  return (
    <div
      ref={canvasRef}
      className={`
        canvas-container w-full h-full overflow-hidden relative
        ${gridEnabled ? 'canvas-grid' : ''}
      `}
      style={{
        backgroundColor: canvasBackgroundColor
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Canvas content with zoom and pan */}
      <div
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
          // Disable transition during interaction for better performance
          transition: isInteracting ? 'none' : 'transform 0.1s ease-out',
          position: 'relative'
        }}
      >
        {elements.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center pointer-events-none">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {currentBoard.name}
              </h3>
              <p className="text-text-secondary">
                This board is empty. Use the toolbar below to add elements.
              </p>
              <p className="text-sm text-text-tertiary mt-2">
                Click on a tool icon in the toolbar to create an element
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full h-full"
            onClick={handleCanvasClick}
          >
            {/* Render only top-level elements (not children of columns) */}
            {/* Exception: also render the currently dragged element even if it's in a column */}
            {elements
              .filter((element) => {
                // Filter out elements that don't belong to this board
                if (element.boardId !== currentBoardId) {
                  return false;
                }

                // Always render the element being dragged
                if (element.id === draggedElementId) {
                  return true;
                }

                // Check if this element is a child of any column
                const isChildOfColumn = elements.some(
                  (el) =>
                    el.type === 'column' &&
                    el.content.childrenIds?.includes(element.id)
                );
                return !isChildOfColumn;
              })
              .map((element) => (
                <div key={element.id}>
                  <CanvasElement
                    element={element}
                    isSelected={selectedIds.includes(element.id)}
                    onSelect={() => selectElement(element.id)}
                  />
                  {/* Show anchor points when Arrow tool is active */}
                  <AnchorPoints
                    element={element}
                    onAnchorClick={handleAnchorClick}
                  />
                </div>
              ))}
          </div>
        )}

        {/* Selection Box */}
        {selectionBox && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${selectionBox.left}px`,
              top: `${selectionBox.top}px`,
              width: `${selectionBox.width}px`,
              height: `${selectionBox.height}px`,
              border: '2px dashed #3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              zIndex: 10000
            }}
          />
        )}
      </div>

      {/* Canvas info (bottom right) */}
      <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-text-tertiary dark:text-gray-400 pointer-events-none">
        Board: {currentBoard.name} • Elements: {elements.length}
      </div>

      {/* Horizontal Scrollbar */}
      <div
        className="absolute bottom-0 left-0 right-3 h-3 bg-gray-200/50 dark:bg-gray-700/50 cursor-pointer"
        onClick={handleScrollbarTrackClick('horizontal')}
      >
        <div
          className="absolute top-0 h-full bg-gray-400 dark:bg-gray-500 rounded-full hover:bg-gray-500 dark:hover:bg-gray-400 transition-colors cursor-grab active:cursor-grabbing"
          style={{
            left: `${scrollbarInfo.hThumbPosition}px`,
            width: `${scrollbarInfo.hThumbWidth}px`
          }}
          onMouseDown={handleScrollbarMouseDown('horizontal')}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Vertical Scrollbar */}
      <div
        className="absolute top-0 right-0 bottom-3 w-3 bg-gray-200/50 dark:bg-gray-700/50 cursor-pointer"
        onClick={handleScrollbarTrackClick('vertical')}
      >
        <div
          className="absolute left-0 w-full bg-gray-400 dark:bg-gray-500 rounded-full hover:bg-gray-500 dark:hover:bg-gray-400 transition-colors cursor-grab active:cursor-grabbing"
          style={{
            top: `${scrollbarInfo.vThumbPosition}px`,
            height: `${scrollbarInfo.vThumbHeight}px`
          }}
          onMouseDown={handleScrollbarMouseDown('vertical')}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Corner square */}
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-300/50 dark:bg-gray-600/50" />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          canvasPosition={contextMenu.canvasPosition}
          onClose={handleCloseContextMenu}
          onExport={onExport}
        />
      )}
    </div>
  );
}
