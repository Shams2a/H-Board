/**
 * BoardLink Component
 * Link to a sub-board that opens in the canvas
 */

import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BoardElement } from '../../types';
import { useElementStore, useBoardStore, selectBoards, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { Square, FolderInput, Trello, Database } from 'lucide-react';

interface BoardLinkProps {
  element: BoardElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function BoardLink({ element, isSelected, onSelect: _onSelect, parentColumnId }: BoardLinkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const updateElement = useElementStore(state => state.updateElement);
  const boards = useBoardStore(selectBoards);
  const updateBoard = useBoardStore(state => state.updateBoard);
  const draggedElementId = useDragStore(state => state.draggedElementId);
  const justFinishedDrag = useDragStore(state => state.justFinishedDrag);
  const dropTargetBoardId = useDragStore(state => state.dropTargetBoardId);
  const isDropReady = useDragStore(state => state.isDropReady);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(element.content.title || 'Untitled Board');
  const [, setIsHoveredWithDrag] = useState(false);

  const isBeingDragged = draggedElementId === element.id;
  const isDropTarget = dropTargetBoardId === element.content.linkedBoardId;

  // Get the linked board to determine its type
  const linkedBoard = boards.find(b => b.id === element.content.linkedBoardId);
  const boardType = linkedBoard?.type || 'canvas';

  // Icon based on board type
  const getBoardIcon = () => {
    if (isDropTarget && isDropReady) {
      return <FolderInput className="w-6 h-6 text-green-600 animate-bounce" />;
    }

    switch (boardType) {
      case 'kanban':
        return <Trello className="w-6 h-6 text-blue-600" />;
      case 'database':
        return <Database className="w-6 h-6 text-amber-600" />;
      case 'canvas':
      default:
        return <Square className="w-6 h-6 text-primary-600" />;
    }
  };

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Focus container when selected for keyboard events
  useEffect(() => {
    if (isSelected && containerRef.current && !isEditingTitle) {
      // Delay focus to allow double-click to register
      const timer = setTimeout(() => {
        if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
          containerRef.current.focus();
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isSelected, isEditingTitle]);

  // Handle drag enter/leave for drop target detection
  const handleDragEnter = () => {
    if (draggedElementId && draggedElementId !== element.id && element.content.linkedBoardId) {
      setIsHoveredWithDrag(true);
      useDragStore.getState().setDropTargetBoard(element.content.linkedBoardId);

      // Start 1s timer
      hoverTimerRef.current = setTimeout(() => {
        useDragStore.getState().setDropReady(true);
      }, 1000);
    }
  };

  const handleDragLeave = () => {
    setIsHoveredWithDrag(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (dropTargetBoardId === element.content.linkedBoardId) {
      useDragStore.getState().setDropTargetBoard(null);
    }
  };

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const handleOpenBoard = () => {
    if (element.content.linkedBoardId) {
      navigate(`/board/${element.content.linkedBoardId}`);
    }
  };

  const handleSaveTitle = async () => {
    const finalTitle = title.trim() || 'Untitled Board';
    setTitle(finalTitle);

    // Update the element content
    await updateElement(element.id, {
      content: {
        ...element.content,
        title: finalTitle
      }
    });

    // Also update the actual board name
    if (element.content.linkedBoardId) {
      await updateBoard(element.content.linkedBoardId, {
        name: finalTitle
      });
    }

    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter key to edit title when selected
    if (e.key === 'Enter' && isSelected && !element.locked && !isEditingTitle) {
      e.preventDefault();
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 10);
    }
  };

  return (
    <div
      ref={containerRef}
      data-element-id={element.id}
      className={`${(parentColumnId && !isBeingDragged) ? 'relative flex flex-col items-center' : 'absolute'}`}
      style={{
        ...((parentColumnId && !isBeingDragged) ? {} : {
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
        }),
        width: (parentColumnId && !isBeingDragged) ? '100%' : `${element.size.width}px`,
        zIndex: element.zIndex,
        backgroundColor: 'transparent',
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
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Icon Square */}
      <div
        className={`
          border-2 rounded-lg flex items-center justify-center
          ${isSelected ? 'border-primary-500 ring-2 ring-primary-500' : 'border-primary-300'}
          ${element.locked ? 'cursor-not-allowed' : 'cursor-move'}
          transition-all hover:opacity-80
        `}
        style={{
          width: `${element.size.width}px`,
          height: `${element.size.width}px`,
          backgroundColor: element.style.backgroundColor || '#DBEAFE'
        }}
        onMouseDown={(e) => {
          if (!element.locked) {
            handleMouseDown(e);
          }
        }}
        onMouseEnter={handleDragEnter}
        onMouseLeave={handleDragLeave}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!element.locked) {
            handleOpenBoard();
          }
        }}
      >
        {getBoardIcon()}
      </div>

      {/* Title below */}
      <div
        className="mt-1 text-center bg-transparent"
        style={{ width: `${element.size.width}px` }}
      >
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveTitle();
              } else if (e.key === 'Escape') {
                setTitle(element.content.title || 'Untitled Board');
                setIsEditingTitle(false);
              }
              e.stopPropagation();
            }}
            autoFocus
            className="w-full px-1 py-0.5 text-sm font-semibold border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-center bg-white dark:bg-[#252B32] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="text-sm font-semibold text-gray-900 dark:text-white px-1 cursor-text bg-transparent text-center"
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!element.locked) {
                setIsEditingTitle(true);
              }
            }}
          >
            {element.content.title || 'Untitled Board'}
          </div>
        )}
      </div>
    </div>
  );
}
