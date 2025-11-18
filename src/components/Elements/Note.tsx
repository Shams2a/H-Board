/**
 * Note Component
 * Editable text card with rich text formatting
 */

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useRef } from 'react';
import type { NoteElement } from '../../types';
import { useElementStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';

// Import TipTap extensions
import * as StarterKitModule from '@tiptap/starter-kit';
import * as PlaceholderModule from '@tiptap/extension-placeholder';
import * as ColorModule from '@tiptap/extension-color';
import * as TextStyleModule from '@tiptap/extension-text-style';

const StarterKit = StarterKitModule.default || StarterKitModule;
const Placeholder = PlaceholderModule.default || PlaceholderModule;
const Color = ColorModule.default || ColorModule;
const TextStyle = TextStyleModule.default || TextStyleModule;

interface NoteProps {
  element: NoteElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function Note({ element, isSelected, onSelect, parentColumnId }: NoteProps) {
  const { updateElement } = useElementStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const { handleMouseDown: handleResizeMouseDown } = useResizable({
    elementId: element.id,
    minWidth: 200,
    minHeight: 100,
    maxWidth: 1200,
    maxHeight: 1200
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing...'
      }),
      TextStyle,
      Color
    ],
    content: element.content.text || '',
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
        class: 'outline-none'
      }
    }
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

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

      {/* Editor Content */}
      <div className="p-3">
        <EditorContent editor={editor} />
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
