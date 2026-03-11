/**
 * KanbanCard Component
 * Displays a compact Kanban card with drag & drop
 */

import React, { useState, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Paperclip, CheckSquare, AlertCircle, Trash2, GripVertical } from 'lucide-react';
import { useKanbanCardStore } from '../../store/kanbanStore';
import KanbanCardModal from './KanbanCardModal';
import type { KanbanCard as KanbanCardType } from '../../types';

interface KanbanCardProps {
  card: KanbanCardType;
  isDragging?: boolean;
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 dark:bg-[#252B32] dark:text-[#B1B9C4]',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
};

const PRIORITY_ICONS = {
  low: '○',
  medium: '◐',
  high: '●',
  urgent: '‼'
};

const KanbanCard = memo(function KanbanCard({ card, isDragging = false }: KanbanCardProps) {
  // Actions accessed via getState() since they're only used in event handlers
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: card.id });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [showModal, setShowModal] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1
  };

  // Calculate checklist progress
  const checklistTotal = card.checklist.length;
  const checklistCompleted = card.checklist.filter((item) => item.completed).length;
  const checklistProgress = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;

  // Check if overdue
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  // Handle title edit
  const handleTitleEdit = async () => {
    if (!editedTitle.trim() || editedTitle === card.title) {
      setIsEditingTitle(false);
      setEditedTitle(card.title);
      return;
    }
    await useKanbanCardStore.getState().updateCard(card.id, { title: editedTitle });
    setIsEditingTitle(false);
  };

  // Handle delete
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
      await useKanbanCardStore.getState().deleteCard(card.id);
    }
  };

  // Handle click to open modal (with delay to detect double-click)
  const handleClick = (_e: React.MouseEvent) => {
    // Don't open modal if editing title
    if (isEditingTitle) return;

    // Clear any existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    // Set timeout to open modal after 250ms (if no double-click)
    const timeout = setTimeout(() => {
      setShowModal(true);
      setClickTimeout(null);
    }, 250);

    setClickTimeout(timeout);
  };

  // Handle double-click to edit (quick edit)
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Cancel the single click timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    // Enter edit mode
    setIsEditingTitle(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="group bg-white dark:bg-[#252B32] rounded-lg border border-gray-200 dark:border-[#3D444D] p-3 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all relative"
      >
      {/* Drag handle - visible on hover */}
      <button
        {...listeners}
        className="absolute top-2 left-2 p-1 opacity-0 group-hover:opacity-100 bg-white dark:bg-[#2C333A] hover:bg-gray-100 dark:hover:bg-[#2C333A] rounded transition-all z-10 cursor-grab active:cursor-grabbing"
        title="Déplacer la carte"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-500 dark:text-[#B1B9C4]" />
      </button>

      {/* Delete button - visible on hover */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 bg-white dark:bg-[#2C333A] hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all z-10"
        title="Supprimer la carte"
      >
        <Trash2 className="w-3.5 h-3.5 text-gray-500 dark:text-[#B1B9C4] hover:text-red-600 dark:hover:text-red-400" />
      </button>

      {/* Cover image */}
      {card.coverImage && (
        <div className="mb-2 -mx-3 -mt-3">
          <img
            src={card.coverImage}
            alt="Cover"
            className="w-full h-32 object-cover rounded-t-lg"
          />
        </div>
      )}

      {/* Title */}
      {isEditingTitle ? (
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') handleTitleEdit();
            if (e.key === 'Escape') {
              setIsEditingTitle(false);
              setEditedTitle(card.title);
            }
          }}
          onBlur={handleTitleEdit}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-sm font-medium border border-primary-500 dark:border-primary-400 rounded px-2 py-1 mb-2 bg-white dark:bg-[#2C333A] text-gray-900 dark:text-[#E0E6ED] focus:outline-none focus:ring-2 focus:ring-primary-500"
          autoFocus
        />
      ) : (
        <h4 className="text-sm font-medium text-gray-900 dark:text-[#E0E6ED] mb-2">
          {card.title}
        </h4>
      )}

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-[#2C333A] text-gray-700 dark:text-[#B1B9C4] rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer - Metadata */}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-[#B1B9C4]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority */}
          {card.priority !== 'medium' && (
            <span
              className={`px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[card.priority]}`}
              title={`Priorité: ${card.priority}`}
            >
              {PRIORITY_ICONS[card.priority]}
            </span>
          )}

          {/* Due date */}
          {card.dueDate && (
            <span
              className={`flex items-center gap-1 ${
                isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''
              }`}
              title={`Échéance: ${new Date(card.dueDate).toLocaleDateString()}`}
            >
              {isOverdue && <AlertCircle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              <span>{new Date(card.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </span>
          )}

          {/* Checklist progress */}
          {checklistTotal > 0 && (
            <span
              className={`flex items-center gap-1 ${
                checklistProgress === 100 ? 'text-green-600 dark:text-green-400 font-medium' : ''
              }`}
              title={`Checklist: ${checklistCompleted}/${checklistTotal}`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>{checklistCompleted}/{checklistTotal}</span>
            </span>
          )}

          {/* Attachments count */}
          {card.attachments.length > 0 && (
            <span
              className="flex items-center gap-1"
              title={`${card.attachments.length} pièce(s) jointe(s)`}
            >
              <Paperclip className="w-3 h-3" />
              <span>{card.attachments.length}</span>
            </span>
          )}
        </div>
      </div>

      {/* Checklist progress bar */}
      {checklistTotal > 0 && (
        <div className="mt-2 h-1 bg-gray-200 dark:bg-[#2C333A] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              checklistProgress === 100
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${checklistProgress}%` }}
          />
        </div>
      )}
      </div>

      {/* Card Modal */}
      <KanbanCardModal
        card={card}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
});

export default KanbanCard;
