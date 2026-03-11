/**
 * BoardTypeSelector Component
 * Modal for selecting board type when creating a new board
 */

import { useState } from 'react';
import { Layout, Columns, Database } from 'lucide-react';
import type { BoardType } from '../../types';

interface BoardTypeOption {
  type: BoardType;
  icon: React.ReactNode;
  name: string;
  description: string;
  color: string;
}

const BOARD_TYPES: BoardTypeOption[] = [
  {
    type: 'canvas',
    icon: <Layout className="w-8 h-8" />,
    name: 'Canvas Infini',
    description: 'Espace libre pour organiser vos idées visuellement',
    color: '#3B82F6'
  },
  {
    type: 'kanban',
    icon: <Columns className="w-8 h-8" />,
    name: 'Kanban',
    description: 'Gestion de tâches en colonnes (Todo, Doing, Done)',
    color: '#10B981'
  },
  {
    type: 'database',
    icon: <Database className="w-8 h-8" />,
    name: 'Database',
    description: 'Table avec propriétés typées et vues multiples',
    color: '#8B5CF6'
  }
];

interface BoardTypeSelectorProps {
  onSelect: (name: string, type: BoardType) => void;
  onClose: () => void;
}

export default function BoardTypeSelector({ onSelect, onClose }: BoardTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<BoardType | null>(null);
  const [boardName, setBoardName] = useState('');

  const handleCreate = () => {
    if (!boardName.trim() || !selectedType) return;
    onSelect(boardName.trim(), selectedType);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1E252B] rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E0E6ED] mb-2">
            Créer un nouveau tableau
          </h2>
          <p className="text-gray-600 dark:text-[#B1B9C4]">
            Choisissez le type de tableau et donnez-lui un nom
          </p>
        </div>

        {/* Board name input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">
            Nom du tableau
          </label>
          <input
            type="text"
            placeholder="Mon nouveau tableau..."
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full px-4 py-2 border border-gray-300 dark:border-[#3D444D] bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
          />
        </div>

        {/* Board type cards */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">
            Type de tableau
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BOARD_TYPES.map((boardType) => (
              <button
                key={boardType.type}
                onClick={() => setSelectedType(boardType.type)}
                className={`group flex flex-col items-center text-center p-6 rounded-lg border-2 transition-all hover:shadow-lg ${
                  selectedType === boardType.type
                    ? 'border-primary-500 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-[#30363D] hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                {/* Icon */}
                <div
                  className="mb-4 p-4 rounded-full transition-colors"
                  style={{
                    backgroundColor: `${boardType.color}20`,
                    color: boardType.color
                  }}
                >
                  {boardType.icon}
                </div>

                {/* Name */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#E0E6ED] mb-2">
                  {boardType.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-[#B1B9C4]">
                  {boardType.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#252B32] rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={!boardName.trim() || !selectedType}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
