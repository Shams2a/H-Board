/**
 * BoardCard Component
 * Displays a single board as a card in the dashboard
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, Tag, Trash2, Copy, MoreVertical } from 'lucide-react';
import type { Board } from '../../types';
import { useBoardStore } from '../../store';

interface BoardCardProps {
  board: Board;
}

export default function BoardCard({ board }: BoardCardProps) {
  const navigate = useNavigate();
  const { deleteBoard, duplicateBoard } = useBoardStore();

  const handleOpen = () => {
    navigate(`/board/${board.id}`);
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

  return (
    <div
      onClick={handleOpen}
      className="group bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer border border-gray-200 hover:border-primary-400 overflow-hidden"
    >
      {/* Preview/Thumbnail */}
      <div
        className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center"
        style={{ backgroundColor: board.settings.backgroundColor }}
      >
        <div className="text-4xl font-bold text-primary-600 opacity-20">
          {board.name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
          {board.name}
        </h3>

        {/* Description */}
        {board.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {board.description}
          </p>
        )}

        {/* Tags */}
        {board.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {board.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {board.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                +{board.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(board.updatedAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDuplicate}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
