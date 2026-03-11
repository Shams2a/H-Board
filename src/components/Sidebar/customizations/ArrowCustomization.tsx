/**
 * ArrowCustomization Component
 * Customization options for Arrow elements
 */

import { useElementStore } from '../../../store';
import type { ArrowElement, ArrowPathType, ArrowHeadStyle } from '../../../types';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  MoreHorizontal,
  Zap,
  TrendingUp,
  MoveRight,
  GitBranch
} from 'lucide-react';

interface ArrowCustomizationProps {
  element: ArrowElement;
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
  { name: 'Orange', value: '#F97316' }
];

const LINE_STYLES = [
  { name: 'Solid', value: 'solid', icon: <Minus className="w-4 h-4" /> },
  { name: 'Dashed', value: 'dashed', icon: <MoreHorizontal className="w-4 h-4" /> },
  { name: 'Dotted', value: 'dotted', icon: <span className="text-xs">•••</span> }
];

const PATH_TYPES: Array<{ name: string; value: ArrowPathType; icon: React.ReactNode }> = [
  { name: 'Straight', value: 'straight', icon: <MoveRight className="w-4 h-4" /> },
  { name: 'Curved', value: 'curved', icon: <TrendingUp className="w-4 h-4" /> },
  { name: 'Elbow', value: 'elbow', icon: <GitBranch className="w-4 h-4 rotate-90" /> }
];

const ARROW_HEAD_STYLES: Array<{ name: string; value: ArrowHeadStyle; symbol: string }> = [
  { name: 'None', value: 'none', symbol: '—' },
  { name: 'Triangle', value: 'triangle', symbol: '▷' },
  { name: 'Filled', value: 'triangle-filled', symbol: '▶' },
  { name: 'Diamond', value: 'diamond', symbol: '◆' },
  { name: 'Circle', value: 'circle', symbol: '●' },
  { name: 'Bar', value: 'bar', symbol: '|' }
];

const THICKNESSES = [
  { name: 'Thin', value: 1 },
  { name: 'Normal', value: 2 },
  { name: 'Medium', value: 3 },
  { name: 'Thick', value: 4 },
  { name: 'Bold', value: 6 }
];

export default function ArrowCustomization({ element }: ArrowCustomizationProps) {
  const updateElement = useElementStore(state => state.updateElement);

  const pathType = element.content.pathType || 'curved';
  const arrowHeadStart = element.content.arrowHeadStart || 'none';
  const arrowHeadEnd = element.content.arrowHeadEnd || 'triangle-filled';
  const lineStyle = element.content.lineStyle || 'solid';
  const thickness = element.content.thickness || 2;
  const color = element.content.color || element.style.borderColor || '#3B82F6';
  const animated = element.content.animated || false;

  const handlePathTypeChange = (type: ArrowPathType) => {
    updateElement(element.id, {
      content: {
        ...element.content,
        pathType: type
      }
    });
  };

  const handleArrowHeadStartChange = (style: ArrowHeadStyle) => {
    updateElement(element.id, {
      content: {
        ...element.content,
        arrowHeadStart: style
      }
    });
  };

  const handleArrowHeadEndChange = (style: ArrowHeadStyle) => {
    updateElement(element.id, {
      content: {
        ...element.content,
        arrowHeadEnd: style
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
      content: {
        ...element.content,
        thickness: value
      },
      style: {
        ...element.style,
        borderWidth: value
      }
    });
  };

  const handleColorChange = (newColor: string) => {
    updateElement(element.id, {
      content: {
        ...element.content,
        color: newColor
      },
      style: {
        ...element.style,
        borderColor: newColor
      }
    });
  };

  const handleAnimatedToggle = () => {
    updateElement(element.id, {
      content: {
        ...element.content,
        animated: !animated
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Path Type */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">Path Type</h4>
        <div className="grid grid-cols-3 gap-2">
          {PATH_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={(e) => {
                e.stopPropagation();
                handlePathTypeChange(type.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                p-2 rounded border-2 transition-all flex flex-col items-center justify-center gap-1
                ${pathType === type.value
                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-[#B1B9C4]'
                }
              `}
              title={type.name}
            >
              {type.icon}
              <span className="text-xs">{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Arrow Head Start */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Start Arrow
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {ARROW_HEAD_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={(e) => {
                e.stopPropagation();
                handleArrowHeadStartChange(style.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                p-2 rounded border-2 transition-all flex flex-col items-center justify-center gap-1
                ${arrowHeadStart === style.value
                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-[#B1B9C4]'
                }
              `}
              title={style.name}
            >
              <span className="text-xl">{style.symbol}</span>
              <span className="text-xs">{style.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Arrow Head End */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          End Arrow
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {ARROW_HEAD_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={(e) => {
                e.stopPropagation();
                handleArrowHeadEndChange(style.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                p-2 rounded border-2 transition-all flex flex-col items-center justify-center gap-1
                ${arrowHeadEnd === style.value
                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-[#B1B9C4]'
                }
              `}
              title={style.name}
            >
              <span className="text-xl">{style.symbol}</span>
              <span className="text-xs">{style.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Line Style */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">Line Style</h4>
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
                  : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-[#B1B9C4]'
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
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">Thickness</h4>
        <div className="grid grid-cols-5 gap-2">
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
                  : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-[#B1B9C4]'
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

      {/* Color */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">Color</h4>
        <div className="grid grid-cols-3 gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={(e) => {
                e.stopPropagation();
                handleColorChange(c.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                w-full aspect-square rounded border-2 transition-all
                ${color === c.value
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Animation */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">Animation</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAnimatedToggle();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`
            w-full p-3 rounded border-2 transition-all flex items-center justify-center gap-2
            ${animated
              ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
              : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-[#B1B9C4]'
            }
          `}
        >
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">
            {animated ? 'Animated Flow' : 'Static'}
          </span>
        </button>
      </div>
    </div>
  );
}
