/**
 * DrawingCustomization Component
 * Full customization panel for Drawing elements.
 * Provides active drawing settings (color, thickness, tool),
 * path management (undo, clear), and background options.
 */

import { useState } from 'react';
import { useElementStore } from '../../../store';
import type { DrawingElement } from '../../../types';

// ── Module-level drawing settings ──────────────────────────────────
// Canvas.tsx can import this object to read the current brush state
// while the user draws. Kept outside React state intentionally so it
// is synchronously readable from pointer-event handlers.
export const drawingSettings = {
  color: '#000000',
  thickness: 3,
  tool: 'pen' as 'pen' | 'eraser',
};

// ── Constants ──────────────────────────────────────────────────────

const STROKE_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'White', value: '#FFFFFF' },
];

const BACKGROUND_COLORS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F3F4F6' },
  { name: 'Light Blue', value: '#DBEAFE' },
  { name: 'Light Yellow', value: '#FEF3C7' },
  { name: 'Light Green', value: '#D1FAE5' },
  { name: 'Light Pink', value: '#FCE7F3' },
  { name: 'Light Purple', value: '#EDE9FE' },
];

// ── Props ──────────────────────────────────────────────────────────

interface DrawingCustomizationProps {
  element: DrawingElement;
}

// ── Component ──────────────────────────────────────────────────────

export default function DrawingCustomization({ element }: DrawingCustomizationProps) {
  const updateElement = useElementStore((state) => state.updateElement);

  // Local state that mirrors the module-level drawingSettings so
  // React re-renders when the user changes a setting.
  const [activeColor, setActiveColor] = useState(drawingSettings.color);
  const [activeThickness, setActiveThickness] = useState(drawingSettings.thickness);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>(drawingSettings.tool);

  // ── Handlers: Active drawing settings ────────────────────────────

  const handleColorChange = (color: string) => {
    drawingSettings.color = color;
    setActiveColor(color);
  };

  const handleThicknessChange = (value: number) => {
    drawingSettings.thickness = value;
    setActiveThickness(value);
  };

  const handleToolChange = (tool: 'pen' | 'eraser') => {
    drawingSettings.tool = tool;
    setActiveTool(tool);
  };

  // ── Handlers: Path management ────────────────────────────────────

  const handleUndo = () => {
    if (element.content.paths.length === 0) return;
    updateElement(element.id, {
      content: {
        ...element.content,
        paths: element.content.paths.slice(0, -1),
      },
    });
  };

  const handleClearAll = () => {
    if (element.content.paths.length === 0) return;
    updateElement(element.id, {
      content: {
        ...element.content,
        paths: [],
      },
    });
  };

  // ── Handlers: Background ─────────────────────────────────────────

  const handleBackgroundColor = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color,
      },
    });
  };

  const handleBackgroundOpacity = (value: number) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        opacity: value / 100,
      },
    });
  };

  // ── Derived values ───────────────────────────────────────────────

  const strokeCount = element.content.paths.length;
  const currentBgColor = element.style.backgroundColor || 'transparent';
  const currentOpacity = element.style.opacity != null ? Math.round(element.style.opacity * 100) : 100;

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Section: Drawing Tool ─────────────────────────────────── */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
          Tool
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => handleToolChange('pen')}
            className={`
              flex-1 px-3 py-2 rounded text-sm font-medium transition-all
              ${activeTool === 'pen'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            Pen
          </button>
          <button
            onClick={() => handleToolChange('eraser')}
            className={`
              flex-1 px-3 py-2 rounded text-sm font-medium transition-all
              ${activeTool === 'eraser'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            Eraser
          </button>
        </div>
      </div>

      {/* ── Section: Stroke Color ─────────────────────────────────── */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
          Stroke Color
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {STROKE_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorChange(color.value)}
              className={`
                w-full aspect-square rounded border-2 transition-all
                ${activeColor === color.value
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

      {/* ── Section: Stroke Thickness ─────────────────────────────── */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
          Thickness
          <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal normal-case">
            {activeThickness}px
          </span>
        </h4>
        <div className="flex items-center gap-3">
          {/* Visual preview of stroke width */}
          <div className="flex items-center justify-center w-8 h-8 shrink-0">
            <div
              className="rounded-full"
              style={{
                width: Math.min(activeThickness, 20),
                height: Math.min(activeThickness, 20),
                backgroundColor: activeTool === 'eraser' ? '#9CA3AF' : activeColor,
              }}
            />
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={activeThickness}
            onChange={(e) => handleThicknessChange(Number(e.target.value))}
            className="flex-1 accent-primary-500"
          />
        </div>
      </div>

      {/* ── Section: Path Management ──────────────────────────────── */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
          Strokes
          <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal normal-case">
            {strokeCount} stroke{strokeCount !== 1 ? 's' : ''}
          </span>
        </h4>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={strokeCount === 0}
            className="flex-1 px-3 py-2 rounded text-sm font-medium transition-all bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Undo Last
          </button>
          <button
            onClick={handleClearAll}
            disabled={strokeCount === 0}
            className="flex-1 px-3 py-2 rounded text-sm font-medium transition-all bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* ── Section: Background Color ─────────────────────────────── */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
          Background
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUND_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleBackgroundColor(color.value)}
              className={`
                w-full aspect-square rounded border-2 transition-all
                ${currentBgColor === color.value
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
                ${color.value === 'transparent' ? 'bg-[length:8px_8px] bg-[image:linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-[position:0_0,4px_4px]' : ''}
              `}
              style={color.value !== 'transparent' ? { backgroundColor: color.value } : undefined}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* ── Section: Background Opacity ───────────────────────────── */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
          Background Opacity
          <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal normal-case">
            {currentOpacity}%
          </span>
        </h4>
        <input
          type="range"
          min={0}
          max={100}
          value={currentOpacity}
          onChange={(e) => handleBackgroundOpacity(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>
    </div>
  );
}
