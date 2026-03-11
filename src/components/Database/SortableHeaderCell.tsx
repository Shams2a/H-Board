/**
 * SortableHeaderCell Component
 * Wrapper for table header cells to make them draggable
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Header } from '@tanstack/react-table';
import type { DatabaseRow } from '../../types';

interface SortableHeaderCellProps {
  header: Header<DatabaseRow, unknown>;
  children: React.ReactNode;
}

export default function SortableHeaderCell({ header, children }: SortableHeaderCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={{ ...style, width: header.getSize() }}
      {...attributes}
      {...listeners}
      className="relative border-r border-b border-gray-200 dark:border-[#30363D] text-left font-medium text-sm text-gray-700 dark:text-[#B1B9C4] px-3 py-2 cursor-grab active:cursor-grabbing"
    >
      {children}

      {/* Column Resizer */}
      {header.column.getCanResize() && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e as any);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          className={`absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary-500 dark:hover:bg-primary-400 z-10 ${
            header.column.getIsResizing() ? 'bg-primary-500 dark:bg-primary-400' : ''
          }`}
          style={{ touchAction: 'none' }}
        />
      )}
    </th>
  );
}
