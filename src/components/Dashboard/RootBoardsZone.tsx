/**
 * RootBoardsZone Component
 * Droppable zone for root-level boards (not in folders)
 */

import { useDroppable } from '@dnd-kit/core';

interface RootBoardsZoneProps {
  children: React.ReactNode;
  viewMode: 'grid' | 'list';
}

export default function RootBoardsZone({ children, viewMode: _viewMode }: RootBoardsZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-boards',
    data: {
      type: 'root'
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all rounded-lg ${
        isOver
          ? 'bg-primary-50/50 ring-2 ring-primary-300 ring-inset p-4'
          : 'p-0'
      }`}
    >
      {children}
    </div>
  );
}
