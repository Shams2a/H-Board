/**
 * TodoList Component
 * Interactive checklist with add, edit, delete, and reorder capabilities
 */

import { useRef, useState, useEffect } from 'react';
import type { TodoElement, TodoItem } from '../../types';
import { useElementStore, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import {
  Check,
  Trash2,
  GripVertical
} from 'lucide-react';

interface TodoListProps {
  element: TodoElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function TodoList({ element, isSelected, onSelect: _onSelect, parentColumnId }: TodoListProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const draggedElementId = useDragStore(state => state.draggedElementId);
  const justFinishedDrag = useDragStore(state => state.justFinishedDrag);
  const dropTargetBoardId = useDragStore(state => state.dropTargetBoardId);
  const isDropReady = useDragStore(state => state.isDropReady);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(element.content.title || '');

  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted background color
  const backgroundColor = useDarkModeColor(element.style.backgroundColor || '#FFFFFF');

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDownSE } = useResizable({
    elementId: element.id,
    minWidth: 250,
    minHeight: 150,
    maxWidth: 800,
    maxHeight: 1200,
    direction: 'se'
  });

  const { handleMouseDown: handleResizeMouseDownNW } = useResizable({
    elementId: element.id,
    minWidth: 250,
    minHeight: 150,
    maxWidth: 800,
    maxHeight: 1200,
    direction: 'nw'
  });

  const items = element.content.items || [];
  const completedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleItem = async (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );

    await updateElement(element.id, {
      content: {
        ...element.content,
        items: updatedItems
      }
    });
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    const newItem: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newItemText.trim(),
      checked: false,
      order: items.length
    };

    await updateElement(element.id, {
      content: {
        ...element.content,
        items: [...items, newItem]
      }
    });

    setNewItemText('');
  };

  const handleEditItem = async (itemId: string, _continueAdding: boolean = false) => {
    if (!editText.trim()) return;

    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, text: editText.trim() } : item
    );

    await updateElement(element.id, {
      content: {
        ...element.content,
        items: updatedItems
      }
    });

    setEditingItemId(null);
    setEditText('');

    // Note: continueAdding parameter exists but we don't need to do anything
    // because the add item input is always visible
  };

  const handleDeleteItem = async (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);

    await updateElement(element.id, {
      content: {
        ...element.content,
        items: updatedItems
      }
    });
  };

  const handleTitleSave = async () => {
    await updateElement(element.id, {
      content: {
        ...element.content,
        title: titleText.trim() || undefined
      }
    });
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter key to edit title when selected
    if (e.key === 'Enter' && isSelected && !element.locked && !isEditingTitle && !editingItemId) {
      e.preventDefault();
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 10);
    }
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

  return (
    <div
      ref={containerRef}
      data-element-id={element.id}
      className={`
        element-card ${(parentColumnId && !isBeingDragged) ? 'relative' : 'absolute'} cursor-move
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : ''}
        ${isBeingDragged && dropTargetBoardId && isDropReady ? 'ring-2 ring-green-500 animate-pulse' : ''}
        ${isBeingDragged && dropTargetBoardId && !isDropReady ? 'ring-2 ring-yellow-500' : ''}
        ${parentColumnId && !isBeingDragged ? 'border border-gray-300 dark:border-gray-500 shadow-none' : ''}
      `}
      style={{
        ...((parentColumnId && !isBeingDragged) ? {} : {
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
        }),
        width: (parentColumnId && !isBeingDragged) ? '100%' : `${element.size.width}px`,
        minHeight: (parentColumnId && !isBeingDragged) ? 'auto' : `${element.size.height}px`,
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
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="p-4">
        {/* Title */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTitleSave();
              } else if (e.key === 'Escape') {
                setTitleText(element.content.title || '');
                setIsEditingTitle(false);
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add title..."
            className="w-full px-2 py-1 mb-3 text-lg font-semibold border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        ) : (
          (element.content.title || isSelected) && (
            <div
              className={`mb-3 text-lg font-semibold cursor-text ${element.content.title ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (isSelected && !element.locked) {
                  setIsEditingTitle(true);
                  setTimeout(() => titleInputRef.current?.focus(), 10);
                }
              }}
            >
              {element.content.title || (isSelected ? 'Press Enter to add title' : '')}
            </div>
          )
        )}

        {/* Progress Bar */}
        {element.content.showProgress && totalCount > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">{completedCount} / {totalCount} completed</span>
              <span className="text-primary-600 font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Todo Items */}
        <div className="space-y-2">

          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-2 group hover:bg-gray-50 dark:hover:bg-gray-700 -mx-2 px-2 py-1.5 rounded transition-colors"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={async (e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                if (draggedId === item.id) return;

                const draggedIndex = items.findIndex(i => i.id === draggedId);
                if (draggedIndex === -1) return;

                const newItems = [...items];
                const [draggedItem] = newItems.splice(draggedIndex, 1);
                newItems.splice(index, 0, draggedItem);

                await updateElement(element.id, {
                  content: {
                    ...element.content,
                    items: newItems.map((item, i) => ({ ...item, order: i }))
                  }
                });
              }}
            >
              {/* Drag Handle */}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-0.5"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4 text-gray-400" />
              </button>

              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleItem(item.id);
                }}
                className={`
                  flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5
                  flex items-center justify-center transition-colors
                  ${item.checked
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-300 hover:border-primary-400'
                  }
                `}
              >
                {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
              </button>

              {/* Item Text */}
              {editingItemId === item.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => handleEditItem(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEditItem(item.id, true); // Continue to add new item after editing
                    } else if (e.key === 'Escape') {
                      setEditingItemId(null);
                      setEditText('');
                    }
                  }}
                  autoFocus
                  className="flex-1 px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={`
                    flex-1 cursor-text
                    ${item.checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}
                  `}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (isSelected && !element.locked) {
                      setEditingItemId(item.id);
                      setEditText(item.text);
                    }
                  }}
                >
                  {item.text}
                </span>
              )}

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Always show empty input for new item */}
          <div className="flex items-center gap-2 -mx-2 px-2 py-1.5">
            <div className="w-4 h-4" /> {/* Spacer for drag handle */}
            <div className="w-5 h-5 rounded border-2 border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem();
                }
                e.stopPropagation();
              }}
              placeholder="New item..."
              className="flex-1 px-2 py-1 text-sm bg-transparent border-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>

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
