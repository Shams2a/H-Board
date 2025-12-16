/**
 * PropertyHeader Component
 * Header for a database property column with edit/delete actions
 */

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Settings } from 'lucide-react';
import { useDatabaseStore } from '../../store/databaseStore';
import { getPropertyTypeInfo } from '../../types/database';
import type { DatabaseProperty, PropertyConfig } from '../../types';
import PropertyConfigModal from './PropertyConfigModal';

interface PropertyHeaderProps {
  property: DatabaseProperty;
  boardId: string;
}

export default function PropertyHeader({ property, boardId }: PropertyHeaderProps) {
  const { updateProperty, deleteProperty } = useDatabaseStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(property.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const typeInfo = getPropertyTypeInfo(property.type);
  const hasConfig = ['number', 'date', 'select', 'multi_select'].includes(property.type);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== property.name) {
      await updateProperty(property.id, { name: editedName.trim() });
    } else {
      setEditedName(property.name);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete property "${property.name}"? This will remove all data in this column.`)) {
      await deleteProperty(property.id);
    }
    setShowMenu(false);
  };

  const handleSaveConfig = async (config: PropertyConfig) => {
    await updateProperty(property.id, { config });
  };

  return (
    <div className="flex items-center gap-2 group">
      {/* Property Icon */}
      <span className="text-base" title={typeInfo?.label}>
        {typeInfo?.icon || '📝'}
      </span>

      {/* Property Name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveName();
            if (e.key === 'Escape') {
              setEditedName(property.name);
              setIsEditing(false);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-1 px-1 py-0.5 text-sm font-medium border border-primary-500 dark:border-primary-400 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-sm font-medium cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to rename"
        >
          {property.name}
        </span>
      )}

      {/* Menu Button */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
          title="More actions"
        >
          <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Edit2 className="w-4 h-4" />
                Rename
              </button>

              {hasConfig && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfigModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
              )}

              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <PropertyConfigModal
          property={property}
          onClose={() => setShowConfigModal(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}
