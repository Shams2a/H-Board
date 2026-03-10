/**
 * FileCustomization Component
 * Customization options for File elements
 */

import { useElementStore } from '../../../store';
import type { FileElement } from '../../../types';

interface FileCustomizationProps {
  element: FileElement;
}

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F3F4F6' },
  { name: 'Gray', value: '#E5E7EB' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Yellow', value: '#FEF3C7' }
];

export default function FileCustomization({ element }: FileCustomizationProps) {
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
    <div>
      <div className="grid grid-cols-3 gap-2">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => handleColorChange(color.value)}
            className={`
              w-full aspect-square rounded border-2 transition-all
              ${(element.style.backgroundColor || '#FFFFFF') === color.value
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
  );
}
