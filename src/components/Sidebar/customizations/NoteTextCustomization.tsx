/**
 * NoteTextCustomization Component
 * Text formatting options for Note elements
 */

import { useElementStore } from '../../../store';
import type { NoteElement } from '../../../types';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

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

export default function NoteTextCustomization({ element }: NoteTextCustomizationProps) {
  const { updateElement } = useElementStore();

  const handleFontSizeChange = (fontSize: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        fontSize
      }
    });
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        fontFamily
      }
    });
  };

  const handleTextAlignChange = (textAlign: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        textAlign
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Size
        </label>
        <div className="space-y-1">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => handleFontSizeChange(size.value)}
              className={`
                w-full px-3 py-2 text-left rounded border transition-all
                ${element.style.fontSize === size.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
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
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Family
        </label>
        <div className="space-y-1">
          {FONT_FAMILIES.map((font) => (
            <button
              key={font.value}
              onClick={() => handleFontFamilyChange(font.value)}
              className={`
                w-full px-3 py-2 text-left rounded border transition-all
                ${element.style.fontFamily === font.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Text Alignment
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleTextAlignChange('left')}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${element.style.textAlign === 'left'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            title="Align Left"
          >
            <AlignLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTextAlignChange('center')}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${element.style.textAlign === 'center'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            title="Align Center"
          >
            <AlignCenter className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTextAlignChange('right')}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${element.style.textAlign === 'right'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            title="Align Right"
          >
            <AlignRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTextAlignChange('justify')}
            className={`
              p-3 rounded border transition-all flex items-center justify-center
              ${element.style.textAlign === 'justify'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
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
