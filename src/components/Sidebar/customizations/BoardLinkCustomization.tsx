/**
 * BoardLinkCustomization Component
 * Customization options for Board Link elements (Color picker)
 */

import { useElementStore } from '../../../store';
import type { BoardElement } from '../../../types';

interface BoardLinkCustomizationProps {
  element: BoardElement;
}

const COLORS = [
  { name: 'Light Blue', value: '#DBEAFE' },
  { name: 'Light Purple', value: '#E9D5FF' },
  { name: 'Light Green', value: '#D1FAE5' },
  { name: 'Light Yellow', value: '#FEF3C7' },
  { name: 'Light Pink', value: '#FCE7F3' },
  { name: 'Light Orange', value: '#FFEDD5' }
];

export default function BoardLinkCustomization({ element }: BoardLinkCustomizationProps) {
  const updateElement = useElementStore(state => state.updateElement);

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
      {/* Color Picker */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Icon Color
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorChange(color.value)}
              className={`
                w-full aspect-square rounded border-2 transition-all
                ${(element.style.backgroundColor || '#DBEAFE') === color.value
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
