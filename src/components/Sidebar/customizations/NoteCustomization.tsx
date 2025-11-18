/**
 * NoteCustomization Component
 * Customization options for Note elements
 */

import { useState } from 'react';
import { useElementStore } from '../../../store';
import type { NoteElement } from '../../../types';
import {
  Palette,
  Type,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface NoteCustomizationProps {
  element: NoteElement;
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

export default function NoteCustomization({ element }: NoteCustomizationProps) {
  const { updateElement } = useElementStore();
  const [colorExpanded, setColorExpanded] = useState(true);
  const [textExpanded, setTextExpanded] = useState(false);

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Color Section */}
      <div>
        <button
          onClick={() => setColorExpanded(!colorExpanded)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Background Color</span>
          </div>
          {colorExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {colorExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`
                    w-full aspect-square rounded border-2 transition-all
                    ${element.style.backgroundColor === color.value
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text Formatting Section */}
      <div>
        <button
          onClick={() => setTextExpanded(!textExpanded)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
        >
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Text Formatting</span>
          </div>
          {textExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {textExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              Text formatting is available in the toolbar when editing the note.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
