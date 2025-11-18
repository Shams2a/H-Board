/**
 * Section Component
 * Visual grouping area with customizable borders and title
 */

import { useRef, useState } from 'react';
import type { SectionElement } from '../../types';
import { useElementStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';

interface SectionProps {
  element: SectionElement;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function Section({ element, isSelected, onSelect }: SectionProps) {
  const { updateElement } = useElementStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(element.content.title || '');

  const { handleMouseDown } = useDraggable({
    elementId: element.id
  });

  const { handleMouseDown: handleResizeMouseDown } = useResizable({
    elementId: element.id,
    minWidth: 300,
    minHeight: 200,
    maxWidth: 2000,
    maxHeight: 1500
  });

  const handleTitleChange = async () => {
    await updateElement(element.id, {
      content: {
        ...element.content,
        title: title.trim()
      }
    });
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={containerRef}
      className={`
        absolute cursor-move border-2 border-dashed rounded-lg
        ${isSelected ? 'border-primary-500 bg-primary-50/30' : 'border-gray-300 bg-gray-50/20'}
        ${element.locked ? 'cursor-not-allowed' : ''}
        backdrop-blur-[2px]
      `}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
        zIndex: element.zIndex,
        backgroundColor: element.style.backgroundColor || 'transparent'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title */}
      {(element.content.title || isEditingTitle || isSelected) && (
        <div className="absolute -top-6 left-0">
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
                  setTitle(element.content.title || '');
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              placeholder="Section title"
              className="px-2 py-1 text-sm font-semibold text-gray-700 bg-white border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="px-2 py-1 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded cursor-text shadow-sm"
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (isSelected && !element.locked) {
                  setIsEditingTitle(true);
                }
              }}
            >
              {element.content.title || 'Untitled Section'}
            </div>
          )}
        </div>
      )}

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
