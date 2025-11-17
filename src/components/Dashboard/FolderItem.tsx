/**
 * FolderItem Component
 * Displays a folder that can contain boards
 */

import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Edit3, Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { Folder as FolderType, Board } from '../../types';
import { useFolderStore, useBoardStore } from '../../store';

interface FolderItemProps {
  folder: FolderType;
  viewMode?: 'grid' | 'list';
  onEdit?: (folder: FolderType) => void;
  children?: React.ReactNode;
}

export default function FolderItem({ folder, viewMode = 'grid', onEdit, children }: FolderItemProps) {
  const { deleteFolder } = useFolderStore();
  const { boards } = useBoardStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folder
    }
  });

  // Count boards in this folder
  const boardCount = boards.filter(b => b.folderId === folder.id && b.parentId === null).length;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Supprimer le dossier "${folder.name}" ? Les projets seront déplacés à la racine.`)) {
      await deleteFolder(folder.id);
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
      <div className="border-b border-gray-100">
        <div
          ref={setNodeRef}
          className={`group px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
            isOver ? 'bg-primary-50 border-primary-300' : 'hover:bg-gray-50'
          }`}
          onClick={handleToggle}
        >
          {/* Expand/Collapse */}
          <button className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Folder Icon */}
          <div
            className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: folder.color || '#FBBF24' }}
          >
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-white" />
            ) : (
              <Folder className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Name and count */}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{folder.name}</h3>
            <p className="text-xs text-gray-500">{boardCount} projet{boardCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Children (boards in folder) */}
        {isExpanded && children && (
          <div className="pl-12 bg-gray-50/50">
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
        className={`group bg-white rounded-lg cursor-pointer border-2 transition-all ${
          isOver
            ? 'border-primary-400 shadow-md bg-primary-50'
            : 'border-transparent hover:border-gray-200'
        }`}
      >
        <div className="p-4 flex items-center gap-3">
          {/* Expand/Collapse */}
          <button className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Folder Icon */}
          <div
            className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: folder.color || '#FBBF24' }}
          >
            {isExpanded ? (
              <FolderOpen className="w-6 h-6 text-white" />
            ) : (
              <Folder className="w-6 h-6 text-white" />
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
            <p className="text-sm text-gray-500">{boardCount} projet{boardCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4 text-gray-600" />
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

      {/* Children (boards in folder) */}
      {isExpanded && children && (
        <div className={`pl-8 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-0'}`}>
          {children}
        </div>
      )}
    </div>
  );
}
