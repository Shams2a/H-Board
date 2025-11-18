/**
 * Column Component
 * Container for organizing elements vertically with a title
 */

import { useRef, useState } from 'react';
import type { ColumnElement } from '../../types';
import { useElementStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { Plus } from 'lucide-react';
import CanvasElement from '../Canvas/CanvasElement';

interface ColumnProps {
  element: ColumnElement;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function Column({ element, isSelected, onSelect }: ColumnProps) {
  const { updateElement, getElementById, elements } = useElementStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(element.content.title || 'Untitled Column');

  const { handleMouseDown } = useDraggable({
    elementId: element.id
  });

  const { handleMouseDown: handleResizeMouseDown } = useResizable({
    elementId: element.id,
    minWidth: 250,
    minHeight: 150,
    maxWidth: 800,
    maxHeight: 2000
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

  // Get child elements
  const childElements = elements.filter(el =>
    element.content.childrenIds.includes(el.id)
  );

  return (
    <div
      ref={containerRef}
      className={`
        element-card absolute border-2 border-gray-300 cursor-move
        ${isSelected ? 'selected ring-2 ring-primary-500 border-primary-400' : ''}
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
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 p-3 flex items-center gap-2">
        {/* Title */}
        {isEditingTitle ? (
          <input
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
            }}
            autoFocus
            className="flex-1 px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-gray-900"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="flex-1 font-semibold text-gray-900 cursor-text"
            onClick={(e) => {
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
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Add element"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement add element to column
            }}
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Content Area - Child Elements */}
      <div className="p-3 space-y-3 min-h-[100px]">
        {childElements.length === 0 ? (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm">
            Drag elements here or click + to add
          </div>
        ) : (
          <div className="relative">
            {childElements.map((child, index) => (
              <div
                key={child.id}
                className="mb-3 last:mb-0"
                style={{
                  // Override absolute positioning for children in column
                  position: 'relative',
                  left: 0,
                  top: 0
                }}
              >
                <CanvasElement
                  element={child}
                  isSelected={false}
                  onSelect={() => {}}
                />
              </div>
            ))}
          </div>
        )}
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
