/**
 * CustomizationSidebar Component
 * Right sidebar showing customization options for selected element
 */

import { useState } from 'react';
import { useElementStore, selectSelectedIds } from '../../store';
import { Palette, Type, Upload, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import NoteCustomization from './customizations/NoteCustomization';
import NoteTextCustomization from './customizations/NoteTextCustomization';
import ImageCustomization from './customizations/ImageCustomization';
import ColumnCustomization from './customizations/ColumnCustomization';
import LinkCustomization from './customizations/LinkCustomization';
import BoardLinkCustomization from './customizations/BoardLinkCustomization';
import FileCustomization from './customizations/FileCustomization';
import TableCustomization from './customizations/TableCustomization';
import TodoListCustomization from './customizations/TodoListCustomization';
import DrawingCustomization from './customizations/DrawingCustomization';
import ShapeCustomization from './customizations/ShapeCustomization';
import LineCustomization from './customizations/LineCustomization';
import ArrowCustomization from './customizations/ArrowCustomization';

type CustomizationPage = 'color' | 'text' | 'image' | 'link' | null;

export default function CustomizationSidebar() {
  const selectedIds = useElementStore(selectSelectedIds);
  const getElementById = useElementStore(state => state.getElementById);
  const [activePage, setActivePage] = useState<CustomizationPage>(null);

  // Only show sidebar if exactly one element is selected
  if (selectedIds.length !== 1) {
    return null;
  }

  const selectedElement = getElementById(selectedIds[0]);

  if (!selectedElement) {
    return null;
  }

  // Define available customization options based on element type
  const getCustomizationOptions = () => {
    const options: Array<{ icon: React.ReactNode; label: string; page: CustomizationPage }> = [];

    // Color customization for all elements
    options.push({
      icon: <Palette className="w-6 h-6" />,
      label: 'Color',
      page: 'color'
    });

    // Type-specific options
    if (selectedElement.type === 'note') {
      options.push({
        icon: <Type className="w-6 h-6" />,
        label: 'Text',
        page: 'text'
      });
    }

    if (selectedElement.type === 'image') {
      options.push({
        icon: <Upload className="w-6 h-6" />,
        label: 'Image',
        page: 'image'
      });
    }

    if (selectedElement.type === 'link') {
      options.push({
        icon: <LinkIcon className="w-6 h-6" />,
        label: 'Link',
        page: 'link'
      });
    }

    return options;
  };

  const options = getCustomizationOptions();

  return (
    <div className="absolute top-20 right-4 bg-white dark:bg-[#1E252B] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg overflow-hidden z-toolbar">
      {activePage === null ? (
        /* Icon View */
        <div className="p-2 flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.page}
              onClick={() => setActivePage(option.page)}
              className="toolbar-button"
              title={option.label}
            >
              {option.icon}
            </button>
          ))}
        </div>
      ) : (
        /* Subpage View */
        <div className="w-80 max-h-[500px] flex flex-col">
          {/* Subpage Header */}
          <div className="p-3 border-b border-gray-200 dark:border-[#30363D] flex items-center gap-2">
            <button
              onClick={() => setActivePage(null)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-[#B1B9C4]" />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-[#E0E6ED] flex-1">
              {options.find(opt => opt.page === activePage)?.label}
            </h3>
          </div>

          {/* Subpage Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePage === 'color' && selectedElement.type === 'note' && (
              <NoteCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'image' && (
              <ImageCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'column' && (
              <ColumnCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'link' && (
              <LinkCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'board' && (
              <BoardLinkCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'file' && (
              <FileCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'table' && (
              <TableCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'todo' && (
              <TodoListCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'drawing' && (
              <DrawingCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'shape' && (
              <ShapeCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'line' && (
              <LineCustomization element={selectedElement} />
            )}
            {activePage === 'color' && selectedElement.type === 'arrow' && (
              <ArrowCustomization element={selectedElement} />
            )}
            {activePage === 'text' && selectedElement.type === 'note' && (
              <NoteTextCustomization element={selectedElement} />
            )}
            {activePage === 'image' && selectedElement.type === 'image' && (
              <ImageCustomization element={selectedElement} />
            )}
            {activePage === 'link' && selectedElement.type === 'link' && (
              <LinkCustomization element={selectedElement} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
