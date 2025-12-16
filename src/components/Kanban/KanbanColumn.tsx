/**
 * KanbanColumn Component
 * Displays a Kanban column with header, cards, and add button
 */

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useKanbanStore } from '../../store/kanbanStore';
import KanbanCard from './KanbanCard';
import { Plus, GripVertical, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '../../types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  boardId: string;
}

export default function KanbanColumn({ column, cards, boardId }: KanbanColumnProps) {
  const { createCard, updateColumn, deleteColumn } = useKanbanStore();

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);

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

    await createCard(column.id, newCardTitle);
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

    await updateColumn(column.id, { name: editedName });
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

    await deleteColumn(column.id);
    setShowMenu(false);
  };

  // Check WIP limit
  const isOverWipLimit = column.wipLimit && cards.length > column.wipLimit;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full"
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700"
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
            className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        ) : (
          <h3
            className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer"
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
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {cards.length}
          {column.wipLimit && ` / ${column.wipLimit}`}
        </span>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  Renommer
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
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
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            Aucune carte
          </div>
        )}
      </div>

      {/* Add card */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
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
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une carte
          </button>
        )}
      </div>
    </div>
  );
}
