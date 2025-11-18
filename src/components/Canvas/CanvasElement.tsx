/**
 * CanvasElement Component
 * Routes to the appropriate element component based on type
 */

import type { Element } from '../../types';
import Note from '../Elements/Note';
import Image from '../Elements/Image';
import Column from '../Elements/Column';

interface CanvasElementProps {
  element: Element;
  isSelected: boolean;
  onSelect: () => void;
}

export default function CanvasElement({ element, isSelected, onSelect }: CanvasElementProps) {
  switch (element.type) {
    case 'note':
      return <Note element={element} isSelected={isSelected} onSelect={onSelect} />;

    case 'image':
      return <Image element={element} isSelected={isSelected} onSelect={onSelect} />;

    case 'column':
      return <Column element={element} isSelected={isSelected} onSelect={onSelect} />;

    case 'section':
      // TODO: Implement Section component
      return (
        <div
          className="absolute p-4 border-2 border-dashed border-gray-300 bg-gray-50/50"
          style={{
            left: `${element.position.x}px`,
            top: `${element.position.y}px`,
            width: `${element.size.width}px`,
            height: `${element.size.height}px`,
            zIndex: element.zIndex
          }}
          onClick={onSelect}
        >
          Section (TODO)
        </div>
      );

    default:
      return (
        <div
          className="element-card absolute p-4"
          style={{
            left: `${element.position.x}px`,
            top: `${element.position.y}px`,
            width: `${element.size.width}px`,
            height: `${element.size.height}px`,
            zIndex: element.zIndex
          }}
          onClick={onSelect}
        >
          {element.type} (Not implemented)
        </div>
      );
  }
}
