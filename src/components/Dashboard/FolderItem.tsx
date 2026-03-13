/**
 * FolderItem Component
 * Displays a folder that can contain boards
 */

import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Edit3, Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { Folder as FolderType } from '../../types';
import { useFolderStore, useBoardStore, selectBoards } from '../../store';

interface FolderItemProps {
  folder: FolderType;
  viewMode?: 'grid' | 'list';
  onEdit?: (folder: FolderType) => void;
  children?: React.ReactNode;
}

export default function FolderItem({ folder, viewMode = 'grid', onEdit, children }: FolderItemProps) {
  const boards = useBoardStore(selectBoards);
  const [isExpanded, setIsExpanded] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folder
    }
  });

  const boardCount = boards.filter(b => b.folderId === folder.id && b.parentId === null).length;
  const folderColor = folder.color || '#FBBF24';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Supprimer le dossier "${folder.name}" ? Les projets seront deplacés à la racine.`)) {
      await useFolderStore.getState().deleteFolder(folder.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(folder);
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  if (viewMode === 'list') {
    return (
      <div className="border-b border-gray-100 dark:border-[#30363D]">
        <div
          ref={setNodeRef}
          className={`group px-6 py-3 flex items-center gap-3 cursor-pointer transition-all ${
            isOver
              ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-inset ring-primary-400 dark:ring-primary-500'
              : 'hover:bg-gray-50 dark:hover:bg-[#252B32]'
          }`}
          onClick={handleToggle}
        >
          {/* Expand/Collapse */}
          <button className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-[#B1B9C4]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-[#B1B9C4]" />
            )}
          </button>

          {/* Folder Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: folderColor }}
          >
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-white" />
            ) : (
              <Folder className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Name and count */}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-[#E0E6ED]">{folder.name}</h3>
            <p className="text-xs text-gray-500 dark:text-[#B1B9C4]">{boardCount} projet{boardCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C333A] rounded transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4 text-gray-600 dark:text-[#B1B9C4]" />
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

        {/* Children (boards in folder) */}
        {isExpanded && children && (
          <div className="pl-6 bg-gray-50/50 dark:bg-[#151A1F]/50 border-l-2 ml-6" style={{ borderLeftColor: folderColor }}>
            {children}
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-2">
      <div
        ref={setNodeRef}
        onClick={handleToggle}
        className={`group rounded-xl cursor-pointer border transition-all overflow-hidden ${
          isOver
            ? 'border-primary-400 dark:border-primary-500 shadow-md bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1E252B] hover:border-gray-300 dark:hover:border-[#3D444D] hover:shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Color accent bar */}
          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: folderColor }} />

          {/* Expand/Collapse */}
          <button className="p-0.5 flex-shrink-0">
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-[#B1B9C4]" />
            </div>
          </button>

          {/* Folder Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: folderColor }}
          >
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-white" />
            ) : (
              <Folder className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-[#E0E6ED] truncate">{folder.name}</h3>
          </div>

          {/* Board count badge */}
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: `${folderColor}18`, color: folderColor }}
          >
            {boardCount} projet{boardCount !== 1 ? 's' : ''}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={handleEdit}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C333A] rounded transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4 text-gray-600 dark:text-[#B1B9C4]" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Drop hint when dragging over */}
        {isOver && (
          <div className="px-4 pb-3 text-xs text-primary-600 dark:text-primary-400 font-medium text-center">
            Deposer ici
          </div>
        )}
      </div>

      {/* Children (boards in folder) */}
      {isExpanded && children && (
        <div
          className="ml-3 pl-4 border-l-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          style={{ borderLeftColor: folderColor }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
