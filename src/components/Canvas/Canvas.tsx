/**
 * Canvas Component
 * Main workspace for placing and manipulating elements
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useBoardStore, selectCurrentBoardId, useElementStore, selectElements, selectSelectedIds, useUIStore, selectZoom, selectPanX, selectPanY, selectGridEnabled, selectActiveTool, useDragStore, useArrowConnectionStore } from '../../store';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import { useCanvasScrollbar } from '../../hooks/useCanvasScrollbar';
import { useCanvasSelection } from '../../hooks/useCanvasSelection';
import { useCanvasWheel } from '../../hooks/useCanvasWheel';
import { generateId } from '../../utils/uuid';
import { newSyncService } from '../../services/supabase/newSyncService';
import CanvasElement from './CanvasElement';
import AnchorPoints from '../Elements/AnchorPoints';
import { ContextMenu } from '../ContextMenu';
import KanbanBoard from '../Kanban/KanbanBoard';
import DatabaseBoard from '../Database/DatabaseBoard';
import { drawingSettings } from '../Sidebar/customizations/DrawingCustomization';
import type { AnchorPosition, ArrowElement, DrawingElement, DrawingPath, Position } from '../../types';

interface CanvasProps {
  onExport?: () => void;
}

export default function Canvas({ onExport }: CanvasProps = {}) {
  const currentBoardId = useBoardStore(selectCurrentBoardId);
  const getCurrentBoard = useBoardStore(state => state.getCurrentBoard);
  const loadElements = useElementStore(state => state.loadElements);
  const elements = useElementStore(selectElements);
  const createElement = useElementStore(state => state.createElement);
  const selectElement = useElementStore(state => state.selectElement);
  const selectedIds = useElementStore(selectSelectedIds);
  const clearSelection = useElementStore(state => state.clearSelection);
  const deleteElements = useElementStore(state => state.deleteElements);
  const undo = useElementStore(state => state.undo);
  const redo = useElementStore(state => state.redo);
  const zoom = useUIStore(selectZoom);
  const panX = useUIStore(selectPanX);
  const panY = useUIStore(selectPanY);
  const gridEnabled = useUIStore(selectGridEnabled);
  const activeTool = useUIStore(selectActiveTool);
  const setPan = useUIStore(state => state.setPan);
  const resetView = useUIStore(state => state.resetView);
  const setActiveTool = useUIStore(state => state.setActiveTool);
  const draggedElementId = useDragStore(state => state.draggedElementId);
  const justFinishedDrag = useDragStore(state => state.justFinishedDrag);
  const updateElement = useElementStore(state => state.updateElement);
  const canvasRef = useRef<HTMLDivElement>(null);
  const previousBoardIdRef = useRef<string | null>(null);

  // Drawing mode refs (using refs to avoid re-renders during drawing)
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<Position[]>([]);
  const activeDrawingIdRef = useRef<string | null>(null);
  const [drawingStroke, setDrawingStroke] = useState<Position[] | null>(null);

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

  // --- Custom hooks ---

  const { scrollbarInfo, handleScrollbarMouseDown, handleScrollbarTrackClick } = useCanvasScrollbar({
    canvasRef,
    zoom,
    panX,
    panY,
    setPan,
    setIsInteracting,
  });

  const {
    selectionBox,
    didSelect,
    setDidSelect,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  } = useCanvasSelection({
    canvasRef,
    zoom,
    panX,
    panY,
    elements,
    selectedIds,
    selectElement,
    clearSelection,
  });

  useCanvasWheel({
    canvasRef,
    panX,
    panY,
    setPan,
    setIsInteracting,
    currentBoardId,
  });

  // --- Effects ---

  useEffect(() => {
    if (currentBoardId) {
      loadElements(currentBoardId);

      if (previousBoardIdRef.current && previousBoardIdRef.current !== currentBoardId) {
        console.log('🔄 Board changed, resetting view');
        resetView();
      }

      previousBoardIdRef.current = currentBoardId;
    }
  }, [currentBoardId, loadElements, resetView]);

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
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('.ProseMirror');

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (isTyping) return;
        e.preventDefault();
        undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        if (isTyping) return;
        e.preventDefault();
        redo();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (isTyping) return;
        e.preventDefault();
        deleteElements(selectedIds);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteElements, undo, redo]);

  // Drawing on existing element: if user selects an existing Drawing element
  // and activates drawing mode, set activeDrawingIdRef to that element's ID
  useEffect(() => {
    if (activeTool === 'drawing' && selectedIds.length === 1) {
      const selectedEl = elements.find(el => el.id === selectedIds[0]);
      if (selectedEl && selectedEl.type === 'drawing') {
        activeDrawingIdRef.current = selectedEl.id;
      }
    }
    if (activeTool !== 'drawing') {
      activeDrawingIdRef.current = null;
      isDrawingRef.current = false;
      setDrawingStroke(null);
    }
  }, [activeTool, selectedIds, elements]);

  // Escape key to deactivate drawing mode
  useEffect(() => {
    if (activeTool !== 'drawing') return;
    const handleDrawingEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool(null);
        activeDrawingIdRef.current = null;
      }
    };
    document.addEventListener('keydown', handleDrawingEscape);
    return () => document.removeEventListener('keydown', handleDrawingEscape);
  }, [activeTool, setActiveTool]);

  // --- Drawing mode event handlers ---

  const handleDrawingMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'drawing') return;

    // Only start drawing on the canvas background, not on elements
    const target = e.target as HTMLElement;
    if (target.closest('.element-card')) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom - panX;
    const y = (e.clientY - rect.top) / zoom - panY;

    isDrawingRef.current = true;
    currentPathRef.current = [{ x, y }];
    setDrawingStroke([{ x, y }]);

    // If no active drawing element, create one
    if (!activeDrawingIdRef.current && currentBoardId) {
      const maxZ = Math.max(0, ...elements.map(el => el.zIndex));
      const newDrawing: DrawingElement = {
        id: generateId(),
        boardId: currentBoardId,
        type: 'drawing',
        position: { x, y },
        size: { width: 400, height: 300 },
        zIndex: maxZ + 1,
        locked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: { paths: [] },
        style: { backgroundColor: 'transparent' },
      };
      activeDrawingIdRef.current = newDrawing.id;
      createElement(newDrawing);
    }

    e.preventDefault();
    e.stopPropagation();
  }, [activeTool, zoom, panX, panY, currentBoardId, elements, createElement]);

  const handleDrawingMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current || activeTool !== 'drawing') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom - panX;
    const y = (e.clientY - rect.top) / zoom - panY;

    currentPathRef.current.push({ x, y });
    // Update visual overlay (batched via React state)
    setDrawingStroke([...currentPathRef.current]);
  }, [activeTool, zoom, panX, panY]);

  const handleDrawingMouseUp = useCallback(async () => {
    if (!isDrawingRef.current || activeTool !== 'drawing') return;

    isDrawingRef.current = false;
    setDrawingStroke(null);

    const drawingId = activeDrawingIdRef.current;
    if (!drawingId || currentPathRef.current.length < 2) return;

    const newPath: DrawingPath = {
      points: [...currentPathRef.current],
      color: drawingSettings.color,
      thickness: drawingSettings.thickness,
      tool: drawingSettings.tool,
    };

    // Find the current drawing element and add the path
    const drawingEl = useElementStore.getState().elements.find(
      el => el.id === drawingId
    ) as DrawingElement | undefined;

    if (drawingEl) {
      await updateElement(drawingId, {
        content: {
          ...drawingEl.content,
          paths: [...drawingEl.content.paths, newPath],
        },
      });
    }

    currentPathRef.current = [];
  }, [activeTool, updateElement]);

  // --- Event handlers ---

  const handleCanvasClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (didSelect) {
      setDidSelect(false);
      return;
    }

    if (justFinishedDrag) {
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('.element-card')) return;

    clearSelection();
  }, [didSelect, setDidSelect, justFinishedDrag, clearSelection]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (e.clientX - rect.left) / zoom - panX;
    const canvasY = (e.clientY - rect.top) / zoom - panY;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasPosition: { x: canvasX, y: canvasY },
    });
  }, [zoom, panX, panY]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle anchor point click for arrow connections
  const handleAnchorClick = useCallback(async (elementId: string, anchor: AnchorPosition) => {
    if (activeTool !== 'arrow') return;

    const connectionData = useArrowConnectionStore.getState().completeConnection(elementId, anchor);

    if (!connectionData) {
      useArrowConnectionStore.getState().startConnection(elementId, anchor);
      return;
    }

    const maxZ = Math.max(0, ...elements.map(el => el.zIndex));

    const newArrow: ArrowElement = {
      id: generateId(),
      boardId: currentBoardId!,
      type: 'arrow',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      zIndex: maxZ + 1,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      style: {
        borderColor: '#9CA3AF',
        borderWidth: 2,
      },
      content: {
        startElementId: connectionData.startElementId,
        endElementId: connectionData.endElementId,
        startAnchor: connectionData.startAnchor,
        endAnchor: connectionData.endAnchor,
        pathType: 'curved',
        lineStyle: 'solid',
        arrowHeadEnd: 'triangle-filled',
        arrowHeadStart: 'none',
        color: '#9CA3AF',
        thickness: 2,
      },
    };

    await createElement(newArrow);
    setActiveTool(null);
  }, [activeTool, elements, currentBoardId, createElement, setActiveTool]);

  // --- Render ---

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

  if (currentBoard.type === 'kanban') {
    return <KanbanBoard boardId={currentBoardId!} />;
  }

  if (currentBoard.type === 'database') {
    return <DatabaseBoard boardId={currentBoardId!} />;
  }

  return (
    <div
      ref={canvasRef}
      className={`
        canvas-container w-full h-full overflow-hidden relative
        ${gridEnabled ? 'canvas-grid' : ''}
      `}
      style={{
        backgroundColor: canvasBackgroundColor,
        cursor: activeTool === 'drawing' ? 'crosshair' : undefined,
      }}
      onClick={handleCanvasClick}
      onMouseDown={(e) => {
        if (activeTool === 'drawing') {
          handleDrawingMouseDown(e);
        } else {
          handleCanvasMouseDown(e);
        }
      }}
      onMouseMove={(e) => {
        if (activeTool === 'drawing') {
          handleDrawingMouseMove(e);
        } else {
          handleCanvasMouseMove(e);
        }
      }}
      onMouseUp={() => {
        if (activeTool === 'drawing') {
          handleDrawingMouseUp();
        } else {
          handleCanvasMouseUp();
        }
      }}
      onMouseLeave={() => {
        if (activeTool === 'drawing') {
          handleDrawingMouseUp();
        } else {
          handleCanvasMouseUp();
        }
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Canvas content with zoom and pan */}
      <div
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
          transition: isInteracting ? 'none' : 'transform 0.1s ease-out',
          position: 'relative',
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
            {elements
              .filter((element) => {
                if (element.boardId !== currentBoardId) {
                  return false;
                }
                if (element.id === draggedElementId) {
                  return true;
                }
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
              zIndex: 10000,
            }}
          />
        )}

        {/* Temporary drawing overlay */}
        {drawingStroke && drawingStroke.length > 1 && (
          <svg
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              zIndex: 10001,
            }}
          >
            <polyline
              points={drawingStroke.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={drawingSettings.tool === 'eraser' ? '#FFFFFF' : drawingSettings.color}
              strokeWidth={drawingSettings.thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
            width: `${scrollbarInfo.hThumbWidth}px`,
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
            height: `${scrollbarInfo.vThumbHeight}px`,
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
