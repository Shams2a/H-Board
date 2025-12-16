/**
 * URLCell Component
 * URL editor with clickable link
 */

import { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface URLCellProps {
  value: string;
  onChange: (value: string) => void;
}

export default function URLCell({ value, onChange }: URLCellProps) {
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

  const handleLinkClick = (e: React.MouseEvent) => {
    if (!isEditing && value) {
      e.stopPropagation();
      // Add https:// if no protocol
      const url = value.match(/^https?:\/\//) ? value : `https://${value}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="url"
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
        placeholder="https://example.com"
        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-primary-500 dark:border-primary-400 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-900 dark:text-gray-100"
      />
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-sm group">
        <a
          href={value.match(/^https?:\/\//) ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          className="flex-1 text-primary-600 dark:text-primary-400 hover:underline truncate"
        >
          {value}
        </a>
        <ExternalLink className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full px-2 py-1 text-sm cursor-text hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded min-h-[28px] text-gray-400 dark:text-gray-500 italic"
    >
      Add URL...
    </div>
  );
}
