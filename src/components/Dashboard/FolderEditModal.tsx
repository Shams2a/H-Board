/**
 * FolderEditModal Component
 * Modal for creating/editing folders
 */

import { useState, useEffect } from 'react';
import { X, Folder as FolderIcon } from 'lucide-react';
import type { Folder } from '../../types';
import { useFolderStore } from '../../store';

interface FolderEditModalProps {
  folder?: Folder | null;
  isOpen: boolean;
  onClose: () => void;
}

const FOLDER_COLORS = [
  { name: 'Jaune', value: '#FBBF24' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Violet', value: '#A855F7' },
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Vert', value: '#10B981' },
  { name: 'Gris', value: '#6B7280' }
];

export default function FolderEditModal({ folder, isOpen, onClose }: FolderEditModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0].value);

  useEffect(() => {
    if (isOpen) {
      setName(folder?.name || '');
      setColor(folder?.color || FOLDER_COLORS[0].value);
    }
  }, [isOpen, folder]);

  const handleSave = async () => {
    if (!name.trim()) return;

    if (folder) {
      await useFolderStore.getState().updateFolder(folder.id, { name: name.trim(), color });
    } else {
      await useFolderStore.getState().createFolder(name.trim(), undefined, color);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1E252B] rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#30363D]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E0E6ED]">
            {folder ? 'Modifier le dossier' : 'Nouveau dossier'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2C333A] rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-[#B1B9C4]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-2">
              Nom du dossier
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#3D444D] bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 placeholder-gray-400 dark:placeholder-[#6B7280]"
              placeholder="Mon dossier"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#B1B9C4] mb-3">
              Couleur
            </label>
            <div className="grid grid-cols-4 gap-3">
              {FOLDER_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => setColor(colorOption.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    color === colorOption.value
                      ? 'border-primary-500 dark:border-primary-400 scale-105 shadow-md'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                >
                  <FolderIcon className="w-6 h-6 text-white mx-auto drop-shadow-sm" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#30363D] bg-gray-50 dark:bg-[#151A1F] rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#2C333A] rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {folder ? 'Enregistrer' : 'Creer'}
          </button>
        </div>
      </div>
    </div>
  );
}
