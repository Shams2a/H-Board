/**
 * KanbanColumn Component
 * Displays a Kanban column with header, cards, and add button
 */

import { useState, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useKanbanColumnStore, useKanbanCardStore } from '../../store/kanbanStore';
import KanbanCard from './KanbanCard';
import { Plus, GripVertical, MoreVertical, Trash2, Edit2, Palette } from 'lucide-react';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '../../types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  boardId: string;
}

const KanbanColumn = memo(function KanbanColumn({ column, cards, boardId: _boardId }: KanbanColumnProps) {
  // Actions accessed via getState() since they're only used in event handlers

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Sortable for column drag & drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Sort cards by position
  const sortedCards = [...cards].sort((a, b) => a.position - b.position);

  // Handle add card
  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    await useKanbanCardStore.getState().createCard(column.id, newCardTitle);
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  // Handle rename column
  const handleRename = async () => {
    if (!editedName.trim() || editedName === column.name) {
      setIsEditingName(false);
      setEditedName(column.name);
      return;
    }

    await useKanbanColumnStore.getState().updateColumn(column.id, { name: editedName });
    setIsEditingName(false);
  };

  // Handle delete column
  const handleDelete = async () => {
    if (cards.length > 0) {
      const confirmed = window.confirm(
        `Cette colonne contient ${cards.length} carte(s). Êtes-vous sûr de vouloir la supprimer ?`
      );
      if (!confirmed) return;
    }

    await useKanbanColumnStore.getState().deleteColumn(column.id);
    setShowMenu(false);
  };

  // Handle color change
  const COLUMN_COLORS = [
    '#9CA3AF', // Gray
    '#60A5FA', // Blue
    '#34D399', // Green
    '#FBBF24', // Yellow
    '#F97316', // Orange
    '#F87171', // Red
    '#EC4899', // Pink
    '#A78BFA', // Purple
    '#2DD4BF', // Teal
    '#38BDF8', // Sky
  ];

  const handleColorChange = async (color: string) => {
    await useKanbanColumnStore.getState().updateColumn(column.id, { color });
    setShowColorPicker(false);
    setShowMenu(false);
  };

  // Check WIP limit
  const isOverWipLimit = column.wipLimit && cards.length > column.wipLimit;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 flex flex-col bg-white dark:bg-[#1E252B] rounded-lg border border-gray-200 dark:border-[#30363D] h-full"
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-[#30363D]"
        style={{ borderTopColor: column.color, borderTopWidth: '3px' }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Column name */}
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsEditingName(false);
                setEditedName(column.name);
              }
            }}
            onBlur={handleRename}
            className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 dark:border-[#3D444D] rounded bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        ) : (
          <h3
            className="flex-1 text-sm font-semibold text-gray-900 dark:text-[#E0E6ED] cursor-pointer"
            onDoubleClick={() => setIsEditingName(true)}
          >
            {column.name}
          </h3>
        )}

        {/* Card count and WIP limit */}
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            isOverWipLimit
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              : 'bg-gray-100 text-gray-700 dark:bg-[#252B32] dark:text-[#B1B9C4]'
          }`}
        >
          {cards.length}
          {column.wipLimit && ` / ${column.wipLimit}`}
        </span>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-[#B1B9C4]" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1E252B] rounded-lg shadow-lg border border-gray-200 dark:border-[#30363D] z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#252B32] flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Renommer
                </button>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#252B32] flex items-center gap-2"
                >
                  <Palette className="w-4 h-4" />
                  Couleur
                  <div
                    className="w-3 h-3 rounded-full ml-auto border border-gray-300 dark:border-[#3D444D]"
                    style={{ backgroundColor: column.color }}
                  />
                </button>
                {showColorPicker && (
                  <div className="px-3 py-2 border-t border-gray-100 dark:border-[#30363D]">
                    <div className="grid grid-cols-5 gap-1.5">
                      {COLUMN_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleColorChange(c)}
                          className={`w-6 h-6 rounded-full transition-transform hover:scale-125 ${
                            c === column.color ? 'ring-2 ring-offset-1 ring-primary-500 dark:ring-offset-[#1E252B]' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#252B32] flex items-center gap-2 border-t border-gray-100 dark:border-[#30363D]"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedCards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}

        {/* Empty state */}
        {cards.length === 0 && !isAddingCard && (
          <div className="text-center py-8 text-gray-400 dark:text-[#6B7280] text-sm">
            Aucune carte
          </div>
        )}
      </div>

      {/* Add card */}
      <div className="p-3 border-t border-gray-200 dark:border-[#30363D]">
        {isAddingCard ? (
          <div className="space-y-2">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard();
                }
                if (e.key === 'Escape') {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }
              }}
              placeholder="Titre de la carte..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#3D444D] rounded-lg bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Ajouter
              </button>
              <button
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#252B32] rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#252B32] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une carte
          </button>
        )}
      </div>
    </div>
  );
});

export default KanbanColumn;
