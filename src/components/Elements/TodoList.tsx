/**
 * TodoList Component
 * Interactive checklist with add, edit, delete, and reorder capabilities
 */

import { useRef, useState } from 'react';
import type { TodoElement, TodoItem } from '../../types';
import { useElementStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import {
  Plus,
  Check,
  X,
  Trash2,
  GripVertical
} from 'lucide-react';

interface TodoListProps {
  element: TodoElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function TodoList({ element, isSelected, onSelect, parentColumnId }: TodoListProps) {
  const { updateElement } = useElementStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDown } = useResizable({
    elementId: element.id,
    minWidth: 250,
    minHeight: 150,
    maxWidth: 800,
    maxHeight: 1200
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
    setIsAddingItem(false);
  };

  const handleEditItem = async (itemId: string) => {
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

  const handleToggleProgress = async () => {
    await updateElement(element.id, {
      content: {
        ...element.content,
        showProgress: !element.content.showProgress
      }
    });
  };

  return (
    <div
      ref={containerRef}
      className={`
        element-card absolute cursor-move
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : ''}
      `}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        minHeight: `${element.size.height}px`,
        backgroundColor: element.style.backgroundColor || '#FFFFFF',
        zIndex: element.zIndex
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="p-4">
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
        <div className="space-y-2 mb-3">
          {items.length === 0 && !isAddingItem && (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No items yet</p>
              <p className="text-xs mt-1">Click the + button to add one</p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 group hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded transition-colors"
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
                      handleEditItem(item.id);
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
                    ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}
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

          {/* Add New Item Input */}
          {isAddingItem && (
            <div className="flex items-center gap-2 -mx-2 px-2 py-1.5">
              <div className="w-4 h-4" /> {/* Spacer for drag handle */}
              <div className="w-5 h-5 rounded border-2 border-gray-300 bg-white flex-shrink-0" />
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onBlur={() => {
                  if (!newItemText.trim()) {
                    setIsAddingItem(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddItem();
                  } else if (e.key === 'Escape') {
                    setNewItemText('');
                    setIsAddingItem(false);
                  }
                }}
                autoFocus
                placeholder="New item..."
                className="flex-1 px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNewItemText('');
                  setIsAddingItem(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingItem(true);
            }}
            disabled={isAddingItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add item
          </button>

          {totalCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleProgress();
              }}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {element.content.showProgress ? 'Hide' : 'Show'} progress
            </button>
          )}
        </div>
      </div>

      {/* Resize handle */}
      {isSelected && !element.locked && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-tl cursor-se-resize hover:bg-primary-600 transition-colors"
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize"
        />
      )}
    </div>
  );
}
