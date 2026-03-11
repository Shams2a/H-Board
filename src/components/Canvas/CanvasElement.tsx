/**
 * CanvasElement Component
 * Routes to the appropriate element component based on type
 */

import { useElementStore } from '../../store';
import type { Element } from '../../types';
import Note from '../Elements/Note';
import Image from '../Elements/Image';
import Column from '../Elements/Column';
import Link from '../Elements/Link';
import TodoList from '../Elements/TodoList';
import File from '../Elements/File';
import Table from '../Elements/Table';
import Line from '../Elements/Line';
import Arrow from '../Elements/Arrow';
import Drawing from '../Elements/Drawing';
import BoardLink from '../Elements/BoardLink';
import Shape from '../Elements/Shape';

interface CanvasElementProps {
  element: Element;
  isSelected: boolean;
  onSelect: () => void;
  parentColumnId?: string;
}

export default function CanvasElement({ element, isSelected, onSelect, parentColumnId }: CanvasElementProps) {
  const resolveElement = useElementStore(state => state.resolveElement);

  // Resolve the element - if it's a reference, this will merge source content with instance position/size
  const resolvedElement = resolveElement(element.id) || element;
  switch (resolvedElement.type) {
    case 'note':
      return <Note element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'image':
      return <Image element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'column':
      return <Column element={resolvedElement} isSelected={isSelected} onSelect={onSelect} />;

    case 'board':
      return <BoardLink element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'link':
      return <Link element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'line':
      return <Line element={resolvedElement} isSelected={isSelected} onSelect={onSelect} />;

    case 'arrow':
      return <Arrow element={resolvedElement} isSelected={isSelected} />;

    case 'drawing':
      return <Drawing element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'todo':
      return <TodoList element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'file':
      return <File element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'table':
      return <Table element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    case 'shape':
      return <Shape element={resolvedElement} isSelected={isSelected} onSelect={onSelect} parentColumnId={parentColumnId} />;

    default:
      // TypeScript exhaustiveness check - should never reach here
      // Cast to any to access properties in case a new type is added
      const fallbackElement = resolvedElement as any;
      return (
        <div
          className="element-card absolute p-4"
          style={{
            left: `${fallbackElement.position.x}px`,
            top: `${fallbackElement.position.y}px`,
            width: `${fallbackElement.size.width}px`,
            height: `${fallbackElement.size.height}px`,
            zIndex: fallbackElement.zIndex
          }}
          onClick={onSelect}
        >
          {fallbackElement.type} (Not implemented)
        </div>
      );
  }
}
