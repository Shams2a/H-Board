/**
 * CanvasElement Component
 * Routes to the appropriate element component based on type
 */

import type { Element } from '../../types';
import Note from '../Elements/Note';
import Image from '../Elements/Image';
import Column from '../Elements/Column';
import Link from '../Elements/Link';
import Section from '../Elements/Section';
import TodoList from '../Elements/TodoList';
import File from '../Elements/File';
import Table from '../Elements/Table';
import Line from '../Elements/Line';

interface CanvasElementProps {
  element: Element;
  isSelected: boolean;
  onSelect: () => void;
  parentColumnId?: string;
}

export default function CanvasElement({ element, isSelected, onSelect, parentColumnId }: CanvasElementProps) {
  switch (element.type) {
    case 'note':
      return <Note element={element} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'image':
      return <Image element={element} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'column':
      return <Column element={element} isSelected={isSelected} onSelect={onSelect} />;

    case 'link':
      return <Link element={element} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'section':
      return <Section element={element} isSelected={isSelected} onSelect={onSelect} />;

    case 'line':
      return <Line element={element} isSelected={isSelected} onSelect={onSelect} />;

    case 'todo':
      return <TodoList element={element} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'file':
      return <File element={element} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'table':
      return <Table element={element} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

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
