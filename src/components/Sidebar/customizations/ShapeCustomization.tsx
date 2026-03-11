/**
 * ShapeCustomization Component
 * Customization options for Shape elements
 */

import { useElementStore } from '../../../store';
import type { ShapeElement, ShapeType } from '../../../types';
import { Square, Circle, Triangle, Star } from 'lucide-react';

interface ShapeCustomizationProps {
  element: ShapeElement;
}

const COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' }
];

const SHAPES: Array<{ type: ShapeType; icon: React.ReactNode; label: string }> = [
  { type: 'rectangle', icon: <Square className="w-5 h-5" />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle className="w-5 h-5" />, label: 'Circle' },
  { type: 'triangle', icon: <Triangle className="w-5 h-5" />, label: 'Triangle' },
  { type: 'star', icon: <Star className="w-5 h-5" />, label: 'Star' }
];

export default function ShapeCustomization({ element }: ShapeCustomizationProps) {
  const updateElement = useElementStore(state => state.updateElement);

  const handleShapeChange = (shapeType: ShapeType) => {
    updateElement(element.id, {
      content: {
        ...element.content,
        shapeType
      }
    });
  };

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
      {/* Shape Type Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">Shape</h4>
        <div className="grid grid-cols-4 gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.type}
              onClick={(e) => {
                e.stopPropagation();
                handleShapeChange(shape.type);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                p-2 rounded border-2 transition-all flex items-center justify-center
                ${element.content.shapeType === shape.type
                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-[#B1B9C4]'
                }
              `}
              title={shape.label}
            >
              {shape.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">Color</h4>
        <div className="grid grid-cols-3 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={(e) => {
                e.stopPropagation();
                handleColorChange(color.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                w-full aspect-square rounded border-2 transition-all
                ${(element.style.backgroundColor || '#3B82F6') === color.value
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500'
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
