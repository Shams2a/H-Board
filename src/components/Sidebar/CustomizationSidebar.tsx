/**
 * CustomizationSidebar Component
 * Right sidebar showing customization options for selected element
 */

import { useElementStore } from '../../store';
import { X } from 'lucide-react';
import NoteCustomization from './customizations/NoteCustomization';
import ImageCustomization from './customizations/ImageCustomization';
import ColumnCustomization from './customizations/ColumnCustomization';
import LinkCustomization from './customizations/LinkCustomization';

export default function CustomizationSidebar() {
  const { selectedIds, getElementById, clearSelection } = useElementStore();

  // Only show sidebar if exactly one element is selected
  if (selectedIds.length !== 1) {
    return null;
  }

  const selectedElement = getElementById(selectedIds[0]);

  if (!selectedElement) {
    return null;
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Customization</h2>
        <button
          onClick={clearSelection}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Customization Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedElement.type === 'note' && (
          <NoteCustomization element={selectedElement} />
        )}
        {selectedElement.type === 'image' && (
          <ImageCustomization element={selectedElement} />
        )}
        {selectedElement.type === 'column' && (
          <ColumnCustomization element={selectedElement} />
        )}
        {selectedElement.type === 'link' && (
          <LinkCustomization element={selectedElement} />
        )}
      </div>
    </div>
  );
}
