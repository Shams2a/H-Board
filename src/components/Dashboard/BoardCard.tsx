/**
 * BoardCard Component
 * Displays a single board as a card in the dashboard
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, Copy, Edit3, FileText } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Board } from '../../types';
import { useBoardStore } from '../../store';

interface BoardCardProps {
  board: Board;
  viewMode?: 'grid' | 'list';
  onEdit?: (board: Board) => void;
}

export default function BoardCard({ board, viewMode = 'grid', onEdit }: BoardCardProps) {
  const navigate = useNavigate();
  const deleteBoard = useBoardStore(state => state.deleteBoard);
  const duplicateBoard = useBoardStore(state => state.duplicateBoard);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `board-${board.id}`,
    data: {
      type: 'board',
      board
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : undefined
  };

  const handleOpen = () => {
    navigate(`/board/${board.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(board);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Supprimer le board "${board.name}" ?`)) {
      await deleteBoard(board.id);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateBoard(board.id);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
      >
        <div className="px-6 py-4 flex items-center gap-4 cursor-pointer" onClick={handleOpen}>
          {/* Icon - Drag handle */}
          <div
            {...listeners}
            className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing"
            style={{ backgroundColor: board.settings.backgroundColor || '#E0E7FF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400 opacity-60" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{board.name}</h3>
            {board.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{board.description}</p>
            )}
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 flex-shrink-0">
            {board.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {board.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                +{board.tags.length - 2}
              </span>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
            <Calendar className="w-4 h-4" />
            <span className="hidden md:inline">{formatDate(board.updatedAt)}</span>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (cleaner rectangular design)
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 overflow-hidden"
    >
      {/* Rectangular Icon/Preview - Drag handle only */}
      <div
        {...listeners}
        className="h-24 flex items-center justify-center relative cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: board.settings.backgroundColor || '#E0E7FF' }}
      >
        <FileText className="w-12 h-12 text-primary-600 dark:text-primary-400 opacity-40" />
      </div>

      {/* Content - Click to open */}
      <div className="p-4" onClick={handleOpen}>
        {/* Title */}
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate cursor-pointer">
          {board.name}
        </h3>

        {/* Description */}
        {board.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem] cursor-pointer">
            {board.description}
          </p>
        )}

        {/* Tags */}
        {board.tags && board.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 cursor-pointer">
            {board.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {board.tags.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                +{board.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Metadata and Actions */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 cursor-pointer">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(board.updatedAt)}</span>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleEdit}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleDuplicate}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Dupliquer"
            >
              <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
