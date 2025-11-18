/**
 * ColumnCustomization Component
 * Customization options for Column elements
 */

import { useState } from 'react';
import { useElementStore } from '../../../store';
import type { ColumnElement } from '../../../types';

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
  const [title, setTitle] = useState(element.content.title || 'Untitled Column');

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color
      }
    });
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
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Column title"
      />

      {/* Color Picker */}
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
  );
}
