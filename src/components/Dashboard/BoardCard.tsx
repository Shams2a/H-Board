/**
 * BoardCard Component
 * Displays a single board as a card in the dashboard
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, Copy, Edit3, Layout, Columns, Database } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Board, BoardType } from '../../types';
import { useBoardStore } from '../../store';

interface BoardCardProps {
  board: Board;
  viewMode?: 'grid' | 'list';
  onEdit?: (board: Board) => void;
}

// Board type config: icon, color, label
const BOARD_TYPE_CONFIG: Record<BoardType, { icon: typeof Layout; color: string; label: string }> = {
  canvas: { icon: Layout, color: '#3B82F6', label: 'Canvas' },
  kanban: { icon: Columns, color: '#10B981', label: 'Kanban' },
  database: { icon: Database, color: '#8B5CF6', label: 'Database' },
};

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
    opacity: isDragging ? 0.5 : undefined,
    touchAction: 'none' as const,
  };

  const typeConfig = BOARD_TYPE_CONFIG[board.type] || BOARD_TYPE_CONFIG.canvas;
  const TypeIcon = typeConfig.icon;

  const handleClick = () => {
    if (isDragging) return;
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

  // Show last opened date (lastAccess), fallback to updatedAt
  const displayDate = board.lastAccess || board.updatedAt;

  if (viewMode === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="group bg-white dark:bg-[#1E252B] hover:bg-gray-50 dark:hover:bg-[#252B32] border-b border-gray-100 dark:border-[#30363D] last:border-b-0 transition-colors cursor-pointer"
      >
        <div className="px-6 py-4 flex items-center gap-4">
          {/* Type icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${typeConfig.color}15` }}
          >
            <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-[#E0E6ED] truncate">{board.name}</h3>
            {board.description && (
              <p className="text-sm text-gray-500 dark:text-[#B1B9C4] truncate">{board.description}</p>
            )}
          </div>

          {/* Type badge */}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
          >
            {typeConfig.label}
          </span>

          {/* Tags */}
          <div className="flex gap-1.5 flex-shrink-0">
            {board.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-[#252B32] text-gray-700 dark:text-[#E0E6ED] rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {board.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-[#252B32] text-gray-600 dark:text-[#B1B9C4] rounded text-xs">
                +{board.tags.length - 2}
              </span>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#B1B9C4] flex-shrink-0">
            <Calendar className="w-4 h-4" />
            <span className="hidden md:inline">{formatDate(displayDate)}</span>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C333A] rounded transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4 text-gray-600 dark:text-[#B1B9C4]" />
            </button>
            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C333A] rounded transition-colors"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4 text-gray-600 dark:text-[#B1B9C4]" />
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

  // Grid view
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        handlePointerDown(e);
        listeners?.onPointerDown?.(e as any);
      }}
      onClick={handleClick}
      className="group bg-white dark:bg-[#1E252B] rounded-lg hover:shadow-md transition-all border border-gray-200 dark:border-[#30363D] hover:border-primary-300 dark:hover:border-primary-600 overflow-hidden cursor-pointer"
    >
      {/* Preview header with type indicator */}
      <div
        className="h-24 flex items-center justify-center relative"
        style={{ backgroundColor: board.settings.backgroundColor || '#E0E7FF' }}
      >
        <TypeIcon className="w-10 h-10 opacity-30" style={{ color: typeConfig.color }} />

        {/* Type badge */}
        <span
          className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm"
          style={{
            backgroundColor: `${typeConfig.color}20`,
            color: typeConfig.color,
          }}
        >
          {typeConfig.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-medium text-gray-900 dark:text-[#E0E6ED] mb-1 truncate">
          {board.name}
        </h3>

        {/* Description */}
        {board.description && (
          <p className="text-sm text-gray-500 dark:text-[#B1B9C4] mb-3 line-clamp-2 min-h-[2.5rem]">
            {board.description}
          </p>
        )}

        {/* Tags */}
        {board.tags && board.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {board.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-[#252B32] text-gray-700 dark:text-[#E0E6ED] rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {board.tags.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-[#252B32] text-gray-600 dark:text-[#B1B9C4] rounded text-xs">
                +{board.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Metadata and Actions */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#B1B9C4] pt-2 border-t border-gray-100 dark:border-[#30363D]">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(displayDate)}</span>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleEdit}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-600 dark:text-[#B1B9C4]" />
            </button>
            <button
              onClick={handleDuplicate}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded transition-colors"
              title="Dupliquer"
            >
              <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-[#B1B9C4]" />
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
