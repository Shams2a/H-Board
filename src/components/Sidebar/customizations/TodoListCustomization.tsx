/**
 * TodoListCustomization Component
 * Customization options for TodoList elements
 */

import { useElementStore } from '../../../store';
import type { TodoElement } from '../../../types';

interface TodoListCustomizationProps {
  element: TodoElement;
}

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Pink', value: '#FCE7F3' },
  { name: 'Purple', value: '#E9D5FF' }
];

export default function TodoListCustomization({ element }: TodoListCustomizationProps) {
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
