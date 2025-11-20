/**
 * Note Component
 * Editable text card with rich text formatting
 */

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import type { NoteElement } from '../../types';
import { useElementStore, useDragStore, useEditorStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';

// Import TipTap extensions
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';

interface NoteProps {
  element: NoteElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function Note({ element, isSelected, onSelect, parentColumnId }: NoteProps) {
  const { updateElement } = useElementStore();
  const { draggedElementId, justFinishedDrag, dropTargetBoardId, isDropReady } = useDragStore();
  const { setActiveEditor } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(element.content.title || '');

  // Check if this element is currently being dragged
  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted background color
  const backgroundColor = useDarkModeColor(element.style.backgroundColor || '#FFFFFF');

  const { handleMouseDown, hasMoved } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDownSE } = useResizable({
    elementId: element.id,
    minWidth: 200,
    minHeight: 100,
    maxWidth: 1200,
    maxHeight: 1200,
    direction: 'se'
  });

  const { handleMouseDown: handleResizeMouseDownNW } = useResizable({
    elementId: element.id,
    minWidth: 200,
    minHeight: 100,
    maxWidth: 1200,
    maxHeight: 1200,
    direction: 'nw'
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Saisir le texte...'
      }),
      TextStyle,
      Color
    ],
    content: element.content.text || '',
    editable: isEditing, // Only editable when in edit mode
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      updateElement(element.id, {
        content: {
          ...element.content,
          text: html
        }
      });
    },
    editorProps: {
      attributes: {
        class: 'outline-none pointer-events-none' // Disable pointer events when not editing
      }
    }
  });

  // Update editor editable state and pointer events when isEditing changes
  useEffect(() => {
    if (editor && editor.view) {
      editor.setEditable(isEditing);
      // Enable/disable pointer events on the ProseMirror editor
      try {
        const editorElement = editor.view.dom;
        if (editorElement) {
          editorElement.style.pointerEvents = isEditing ? 'auto' : 'none';
        }
      } catch (error) {
        // Editor not fully mounted yet, ignore
        console.debug('Editor view not ready yet');
      }
    }
  }, [isEditing, editor]);

  // Exit edit mode when note is deselected
  useEffect(() => {
    if (!isSelected && isEditing) {
      setIsEditing(false);
    }
  }, [isSelected, isEditing]);

  // Set active editor for customization panel
  useEffect(() => {
    if (isSelected && editor) {
      setActiveEditor(editor);
    }
    return () => {
      // Clear if this was the active editor
      if (isSelected) {
        setActiveEditor(null);
      }
    };
  }, [isSelected, editor, setActiveEditor]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!element.locked && isSelected) {
      setIsEditing(true);
      // Focus the editor after a short delay
      setTimeout(() => {
        editor?.commands.focus();
      }, 10);
    }
  };

  const handleSingleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't handle click if we just finished dragging
    if (justFinishedDrag) {
      return;
    }

    // If clicking outside editor while editing, exit edit mode
    if (isEditing && !(e.target as HTMLElement).closest('.ProseMirror')) {
      setIsEditing(false);
      return;
    }

    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed for multi-selection
    const isMultiSelect = e.ctrlKey || e.metaKey;

    // If already selected and in a column, enter edit mode (only if not multi-selecting)
    if (isSelected && parentColumnId && !element.locked && !isMultiSelect) {
      setIsEditing(true);
      setTimeout(() => {
        editor?.commands.focus();
      }, 10);
    } else {
      // Select with multi-select support
      const { selectElement } = useElementStore.getState();
      selectElement(element.id, isMultiSelect);
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if we're editing
    if (isEditing || isEditingTitle) {
      return;
    }
    handleMouseDown(e);
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
    if (e.key === 'Enter' && isSelected && !element.locked && !isEditingTitle && !isEditing) {
      e.preventDefault();
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 10);
    }
  };

  // Focus container when selected for keyboard events
  useEffect(() => {
    if (isSelected && containerRef.current && !isEditing && !isEditingTitle) {
      // Delay focus to allow double-click to register
      const timer = setTimeout(() => {
        if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
          containerRef.current.focus();
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isSelected, isEditing, isEditingTitle]);

  if (!editor) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-element-id={element.id}
      className={`
        element-card ${(parentColumnId && !isBeingDragged) ? 'relative' : 'absolute'}
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : isEditing ? 'cursor-text' : 'cursor-move'}
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
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleContainerMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Title */}
      <div className="px-3 pt-3">
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
            className="w-full px-2 py-1 text-lg font-semibold border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        ) : (
          (element.content.title || isSelected) && (
            <div
              className={`text-lg font-semibold cursor-text ${element.content.title ? 'text-gray-900 dark:text-white mb-2' : 'text-gray-400 mb-2'}`}
              onClick={(e) => {
                // Stop propagation to prevent handleSingleClick from exiting edit mode
                e.stopPropagation();
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!element.locked) {
                  if (isEditing) {
                    setIsEditing(false);
                  }
                  setIsEditingTitle(true);
                  setTimeout(() => titleInputRef.current?.focus(), 10);
                }
              }}
            >
              {element.content.title || (isSelected ? 'Press Enter to add title' : '')}
            </div>
          )
        )}
      </div>

      {/* Editor Content */}
      <div
        className={`
          p-3
          ${element.style.fontSize || 'text-base'}
          ${element.style.fontFamily || 'font-sans'}
          ${element.style.lineHeight || 'leading-normal'}
          ${element.style.letterSpacing || 'tracking-normal'}
        `}
        style={{
          textAlign: (element.style.textAlign as 'left' | 'center' | 'right' | 'justify') || 'left'
        }}
      >
        <EditorContent editor={editor} />
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
