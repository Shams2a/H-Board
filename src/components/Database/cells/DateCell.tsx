/**
 * DateCell Component
 * Date/time picker editor
 */

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateCellProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  includeTime?: boolean;
}

export default function DateCell({ value, onChange, includeTime = false }: DateCellProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';

    const d = new Date(date);
    if (includeTime) {
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date for input (YYYY-MM-DD or YYYY-MM-DDTHH:MM)
  const formatForInput = (date: Date | null): string => {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      onChange(null);
    } else {
      onChange(new Date(e.target.value));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setShowPicker(false);
  };

  return (
    <div className="relative w-full">
      <div
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded min-h-[28px] text-gray-900 dark:text-gray-100"
      >
        <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        <span className="flex-1">{formatDate(value)}</span>
        {value && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xs"
          >
            ×
          </button>
        )}
      </div>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <input
              type={includeTime ? 'datetime-local' : 'date'}
              value={formatForInput(value)}
              onChange={handleChange}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
          </div>
        </>
      )}
    </div>
  );
}
