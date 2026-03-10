/**
 * NoteTextCustomization Component
 * Text formatting options for Note elements
 */

import { useElementStore, useEditorStore, selectActiveEditor } from '../../../store';
import type { NoteElement } from '../../../types';
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Code, Strikethrough,
  List, ListOrdered
} from 'lucide-react';

interface NoteTextCustomizationProps {
  element: NoteElement;
}

const FONT_SIZES = [
  { label: 'Small', value: 'text-sm' },
  { label: 'Normal', value: 'text-base' },
  { label: 'Large', value: 'text-lg' },
  { label: 'Extra Large', value: 'text-xl' }
];

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'font-sans' },
  { label: 'Serif', value: 'font-serif' },
  { label: 'Monospace', value: 'font-mono' }
];

const TEXT_COLORS = [
  { label: 'Default', value: '#000000' },
  { label: 'Gray', value: '#6B7280' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Yellow', value: '#EAB308' },
  { label: 'Green', value: '#10B981' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Purple', value: '#8B5CF6' },
];

const LINE_HEIGHTS = [
  { label: 'Compact', value: 'leading-tight' },
  { label: 'Normal', value: 'leading-normal' },
  { label: 'Relaxed', value: 'leading-relaxed' },
  { label: 'Loose', value: 'leading-loose' },
];

const LETTER_SPACINGS = [
  { label: 'Tight', value: 'tracking-tight' },
  { label: 'Normal', value: 'tracking-normal' },
  { label: 'Wide', value: 'tracking-wide' },
];

export default function NoteTextCustomization({ element }: NoteTextCustomizationProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const activeEditor = useEditorStore(selectActiveEditor);

  const handleStyleChange = (key: string, value: any) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        [key]: value
      }
    });
  };

  // TipTap inline formatting commands (apply to selected text)
  const toggleBold = () => {
    activeEditor?.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    activeEditor?.chain().focus().toggleItalic().run();
  };

  const toggleStrike = () => {
    activeEditor?.chain().focus().toggleStrike().run();
  };

  const toggleCode = () => {
    activeEditor?.chain().focus().toggleCode().run();
  };

  const toggleBulletList = () => {
    activeEditor?.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = () => {
    activeEditor?.chain().focus().toggleOrderedList().run();
  };

  const setTextColor = (color: string) => {
    activeEditor?.chain().focus().setColor(color).run();
  };

  const isActive = (type: string) => {
    return activeEditor?.isActive(type) || false;
  };

  const getCurrentColor = () => {
    return activeEditor?.getAttributes('textStyle').color || '#000000';
  };

  return (
    <div className="space-y-6">
      {/* Inline Text Styles (applied to selection) */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Text Style (selection)
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleBold}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${isActive('bold')
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-5 h-5" />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleItalic}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${isActive('italic')
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-5 h-5" />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleStrike}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${isActive('strike')
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Strikethrough"
          >
            <Strikethrough className="w-5 h-5" />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleCode}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${isActive('code')
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Code"
          >
            <Code className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lists */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Lists
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleBulletList}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${isActive('bulletList')
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Bullet List"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleOrderedList}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${isActive('orderedList')
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Numbered List"
          >
            <ListOrdered className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Text Color (applied to selection) */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Text Color (selection)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TEXT_COLORS.map((color) => (
            <button
              key={color.value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTextColor(color.value)}
              className={`
                w-full h-8 rounded border-2 transition-all
                ${getCurrentColor() === color.value
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }
              `}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Block-level styles (applied to entire note) */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Block styles (entire note)</p>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Font Size
        </label>
        <div className="space-y-1">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => handleStyleChange('fontSize', size.value)}
              className={`
                w-full px-3 py-2 text-left rounded border transition-all
                ${element.style.fontSize === size.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                }
              `}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Font Family
        </label>
        <div className="space-y-1">
          {FONT_FAMILIES.map((font) => (
            <button
              key={font.value}
              onClick={() => handleStyleChange('fontFamily', font.value)}
              className={`
                w-full px-3 py-2 text-left rounded border transition-all
                ${element.style.fontFamily === font.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                }
              `}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Height */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Line Height
        </label>
        <div className="space-y-1">
          {LINE_HEIGHTS.map((height) => (
            <button
              key={height.value}
              onClick={() => handleStyleChange('lineHeight', height.value)}
              className={`
                w-full px-3 py-2 text-left rounded border transition-all
                ${element.style.lineHeight === height.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                }
              `}
            >
              {height.label}
            </button>
          ))}
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Letter Spacing
        </label>
        <div className="space-y-1">
          {LETTER_SPACINGS.map((spacing) => (
            <button
              key={spacing.value}
              onClick={() => handleStyleChange('letterSpacing', spacing.value)}
              className={`
                w-full px-3 py-2 text-left rounded border transition-all
                ${element.style.letterSpacing === spacing.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                }
              `}
            >
              {spacing.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Text Alignment
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleStyleChange('textAlign', 'left')}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${element.style.textAlign === 'left'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Align Left"
          >
            <AlignLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleStyleChange('textAlign', 'center')}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${element.style.textAlign === 'center'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Align Center"
          >
            <AlignCenter className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleStyleChange('textAlign', 'right')}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${element.style.textAlign === 'right'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Align Right"
          >
            <AlignRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleStyleChange('textAlign', 'justify')}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${element.style.textAlign === 'justify'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
              }
            `}
            title="Justify"
          >
            <AlignJustify className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
