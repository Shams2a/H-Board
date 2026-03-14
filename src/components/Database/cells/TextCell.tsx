/**
 * TextCell Component
 * Inline text editor for 'title' and 'text' property types
 */

import { useState, useRef, useEffect } from 'react';

interface TextCellProps {
  value: string;
  onChange: (value: string) => void;
  isTitle?: boolean;
}

export default function TextCell({ value, onChange, isTitle = false }: TextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue !== value) {
      onChange(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
        }}
        className="w-full px-2 py-1 text-sm bg-white dark:bg-[#252B32] border border-primary-500 dark:border-primary-400 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-900 dark:text-[#E0E6ED]"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`w-full px-2 py-1 text-sm cursor-text hover:bg-gray-50 dark:hover:bg-[#252B32]/50 rounded min-h-[28px] ${
        isTitle && !value ? 'text-gray-400 dark:text-[#6B7280] italic' : 'text-gray-900 dark:text-[#E0E6ED]'
      }`}
    >
      {value || (isTitle ? 'Sans titre' : '')}
    </div>
  );
}
