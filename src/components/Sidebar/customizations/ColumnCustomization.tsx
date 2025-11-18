/**
 * ColumnCustomization Component
 * Customization options for Column elements
 */

import { useState } from 'react';
import { useElementStore } from '../../../store';
import type { ColumnElement } from '../../../types';
import {
  Palette,
  Type,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface ColumnCustomizationProps {
  element: ColumnElement;
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

export default function ColumnCustomization({ element }: ColumnCustomizationProps) {
  const { updateElement } = useElementStore();
  const [colorExpanded, setColorExpanded] = useState(true);
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [title, setTitle] = useState(element.content.title || 'Untitled Column');

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color
      }
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleTitleBlur = () => {
    updateElement(element.id, {
      content: {
        ...element.content,
        title: title.trim() || 'Untitled Column'
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Title Section */}
      <div>
        <button
          onClick={() => setTitleExpanded(!titleExpanded)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
        >
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Title</span>
          </div>
          {titleExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {titleExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Column title"
            />
          </div>
        )}
      </div>

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
    </div>
  );
}
