/**
 * SectionCustomization Component
 * Customization options for Section elements
 */

import { useElementStore } from '../../../store';
import type { SectionElement } from '../../../types';

interface SectionCustomizationProps {
  element: SectionElement;
}

const COLORS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F3F4F6' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Yellow', value: '#FEF3C7' }
];

export default function SectionCustomization({ element }: SectionCustomizationProps) {
  const { updateElement } = useElementStore();

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
              w-full aspect-square rounded border-2 transition-all relative
              ${(element.style.backgroundColor || 'transparent') === color.value
                ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
            style={{
              backgroundColor: color.value === 'transparent' ? 'white' : color.value,
              backgroundImage: color.value === 'transparent'
                ? 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 50% / 10px 10px'
                : 'none'
            }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
