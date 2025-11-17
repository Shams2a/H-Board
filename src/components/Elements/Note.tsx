/**
 * Note Component
 * Editable text card with rich text formatting
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { useEffect, useRef } from 'react';
import type { NoteElement } from '../../types';
import { useElementStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  GripVertical
} from 'lucide-react';

interface NoteProps {
  element: NoteElement;
  isSelected?: boolean;
  onSelect?: () => void;
}

const COLORS = [
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Orange', value: '#FED7AA' },
  { name: 'Red', value: '#FECACA' },
  { name: 'Pink', value: '#FBCFE8' },
  { name: 'Purple', value: '#E9D5FF' },
  { name: 'Blue', value: '#BFDBFE' },
  { name: 'Green', value: '#BBF7D0' },
  { name: 'Gray', value: '#E5E7EB' },
  { name: 'White', value: '#FFFFFF' }
];

export default function Note({ element, isSelected, onSelect }: NoteProps) {
  const { updateElement } = useElementStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const { handleMouseDown } = useDraggable({
    elementId: element.id
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

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color
      }
    });
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`
        element-card absolute
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
    >
      {/* Drag Handle + Formatting Toolbar */}
      {isSelected && (
        <div className="border-b border-gray-200 p-2 flex items-center gap-2 bg-gray-50/80 backdrop-blur-sm">
          {/* Drag Handle */}
          <div
            className="cursor-move p-1 hover:bg-gray-200 rounded"
            onMouseDown={handleMouseDown}
            title="Drag to move"
          >
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Formatting buttons */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('bold') ? 'bg-gray-300' : ''
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('code') ? 'bg-gray-300' : ''
            }`}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300" />

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          {/* Color picker */}
          <div className="flex gap-1">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-tl cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            // Resize logic will be implemented next
          }}
        />
      )}
    </div>
  );
}
