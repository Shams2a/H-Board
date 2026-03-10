/**
 * LineCustomization Component
 * Customization options for Line/Arrow elements
 */

import { useElementStore } from '../../../store';
import type { LineElement } from '../../../types';
import { ArrowLeft, ArrowRight, Minus, MoreHorizontal } from 'lucide-react';

interface LineCustomizationProps {
  element: LineElement;
}

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'White', value: '#FFFFFF' }
];

const LINE_STYLES = [
  { name: 'Solid', value: 'solid', icon: <Minus className="w-4 h-4" /> },
  { name: 'Dashed', value: 'dashed', icon: <MoreHorizontal className="w-4 h-4" /> },
  { name: 'Dotted', value: 'dotted', icon: <span className="text-xs">•••</span> }
];

const THICKNESSES = [
  { name: 'Thin', value: 1 },
  { name: 'Normal', value: 2 },
  { name: 'Medium', value: 3 },
  { name: 'Thick', value: 4 }
];

export default function LineCustomization({ element }: LineCustomizationProps) {
  const updateElement = useElementStore(state => state.updateElement);

  const arrowStart = element.content.arrowStart ?? false;
  const arrowEnd = element.content.arrowEnd ?? true;
  const lineStyle = element.content.lineStyle || 'solid';
  const thickness = element.style.borderWidth || 2;

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        borderColor: color
      }
    });
  };

  const handleArrowStartToggle = () => {
    updateElement(element.id, {
      content: {
        ...element.content,
        arrowStart: !arrowStart
      }
    });
  };

  const handleArrowEndToggle = () => {
    updateElement(element.id, {
      content: {
        ...element.content,
        arrowEnd: !arrowEnd
      }
    });
  };

  const handleLineStyleChange = (style: 'solid' | 'dashed' | 'dotted') => {
    updateElement(element.id, {
      content: {
        ...element.content,
        lineStyle: style
      }
    });
  };

  const handleThicknessChange = (value: number) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        borderWidth: value
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Arrow Direction */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Arrows</h4>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleArrowStartToggle();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`
              flex-1 p-2 rounded border-2 transition-all flex items-center justify-center gap-2
              ${arrowStart
                ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
              }
            `}
            title="Start arrow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Start</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleArrowEndToggle();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`
              flex-1 p-2 rounded border-2 transition-all flex items-center justify-center gap-2
              ${arrowEnd
                ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
              }
            `}
            title="End arrow"
          >
            <span className="text-xs">End</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Line Style */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Style</h4>
        <div className="grid grid-cols-3 gap-2">
          {LINE_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={(e) => {
                e.stopPropagation();
                handleLineStyleChange(style.value as 'solid' | 'dashed' | 'dotted');
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                p-2 rounded border-2 transition-all flex items-center justify-center
                ${lineStyle === style.value
                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                }
              `}
              title={style.name}
            >
              {style.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Thickness */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thickness</h4>
        <div className="grid grid-cols-4 gap-2">
          {THICKNESSES.map((t) => (
            <button
              key={t.value}
              onClick={(e) => {
                e.stopPropagation();
                handleThicknessChange(t.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                p-2 rounded border-2 transition-all flex items-center justify-center
                ${thickness === t.value
                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                }
              `}
              title={t.name}
            >
              <div
                className="w-full bg-current rounded"
                style={{ height: `${t.value}px` }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</h4>
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
                ${(element.style.borderColor || '#000000') === color.value
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
