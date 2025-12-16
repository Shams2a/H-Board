/**
 * KanbanBoard Component
 * Main container for Kanban board with columns and drag & drop
 */

import { useEffect, useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useKanbanStore } from '../../store/kanbanStore';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { Plus } from 'lucide-react';
import type { KanbanCard as KanbanCardType } from '../../types';

interface KanbanBoardProps {
  boardId: string;
}

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
  const {
    columns,
    cards,
    createColumn,
    reorderColumns,
    moveCard,
    loadKanbanBoard
  } = useKanbanStore();

  const [activeCard, setActiveCard] = useState<KanbanCardType | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const boardColumns = columns[boardId] || [];
  const boardCards = cards[boardId] || [];

  // Load board data on mount
  useEffect(() => {
    loadKanbanBoard(boardId);
  }, [boardId, loadKanbanBoard]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = boardCards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a column
    const isColumn = boardColumns.some((col) => col.id === activeId);

    if (isColumn) {
      // Reorder columns
      const oldIndex = boardColumns.findIndex((col) => col.id === activeId);
      const newIndex = boardColumns.findIndex((col) => col.id === overId);

      if (oldIndex !== newIndex) {
        const reordered = [...boardColumns];
        const [removed] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, removed);
        reorderColumns(boardId, reordered.map((col) => col.id));
      }
    } else {
      // Moving a card
      const activeCard = boardCards.find((c) => c.id === activeId);
      if (!activeCard) return;

      // Determine target column
      let targetColumnId = overId;
      const overColumn = boardColumns.find((col) => col.id === overId);
      if (!overColumn) {
        // Dropped on a card - find its column
        const overCard = boardCards.find((c) => c.id === overId);
        if (overCard) {
          targetColumnId = overCard.columnId;
        }
      }

      // Calculate new position
      const targetCards = boardCards.filter((c) => c.columnId === targetColumnId);
      const overCard = boardCards.find((c) => c.id === overId);
      let newPosition = targetCards.length;

      if (overCard && overCard.columnId === targetColumnId) {
        newPosition = overCard.position;
      }

      // Move card
      if (activeCard.columnId !== targetColumnId || activeCard.position !== newPosition) {
        moveCard(activeCard.id, targetColumnId, newPosition);
      }
    }

    setActiveCard(null);
  };

  // Handle add column
  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;

    await createColumn(boardId, newColumnName);
    setNewColumnName('');
    setIsAddingColumn(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Kanban Board
          </h2>
          {/* TODO: Add filters, search, view toggle */}
        </div>
      </div>

      {/* Columns container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full">
            <SortableContext
              items={boardColumns.map((col) => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {boardColumns
                .sort((a, b) => a.position - b.position)
                .map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={boardCards.filter((card) => card.columnId === column.id)}
                    boardId={boardId}
                  />
                ))}
            </SortableContext>

            {/* Add column button/form */}
            <div className="flex-shrink-0 w-80">
              {isAddingColumn ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') {
                        setIsAddingColumn(false);
                        setNewColumnName('');
                      }
                    }}
                    onBlur={handleAddColumn}
                    placeholder="Nom de la colonne..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full h-full min-h-[100px] flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Ajouter une colonne</span>
                </button>
              )}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeCard ? (
              <div className="opacity-50">
                <KanbanCard card={activeCard} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
