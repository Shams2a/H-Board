/**
 * CustomizationSidebar Component
 * Right sidebar showing customization options for selected element
 */

import { useState } from 'react';
import { useElementStore } from '../../store';
import { X, Palette, Type, Upload, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import NoteCustomization from './customizations/NoteCustomization';
import ImageCustomization from './customizations/ImageCustomization';
import ColumnCustomization from './customizations/ColumnCustomization';
import LinkCustomization from './customizations/LinkCustomization';

type CustomizationPage = 'color' | 'text' | 'image' | 'link' | null;

export default function CustomizationSidebar() {
  const { selectedIds, getElementById } = useElementStore();
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
      icon: <Palette className="w-5 h-5" />,
      label: 'Color',
      page: 'color'
    });

    // Type-specific options
    if (selectedElement.type === 'note' || selectedElement.type === 'column') {
      options.push({
        icon: <Type className="w-5 h-5" />,
        label: 'Text',
        page: 'text'
      });
    }

    if (selectedElement.type === 'image') {
      options.push({
        icon: <Upload className="w-5 h-5" />,
        label: 'Image',
        page: 'image'
      });
    }

    if (selectedElement.type === 'link') {
      options.push({
        icon: <LinkIcon className="w-5 h-5" />,
        label: 'Link',
        page: 'link'
      });
    }

    return options;
  };

  const options = getCustomizationOptions();

  return (
    <div className="absolute top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-toolbar">
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
          <div className="p-3 border-b border-gray-200 flex items-center gap-2">
            <button
              onClick={() => setActivePage(null)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h3 className="font-semibold text-gray-900 flex-1">
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
            {activePage === 'text' && selectedElement.type === 'column' && (
              <ColumnCustomization element={selectedElement} />
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
