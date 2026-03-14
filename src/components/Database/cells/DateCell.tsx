/**
 * DateCell Component
 * Date/time picker editor
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from 'lucide-react';

interface DateCellProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  includeTime?: boolean;
}

export default function DateCell({ value, onChange, includeTime = false }: DateCellProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';

    const d = new Date(date);
    if (includeTime) {
      return d.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return d.toLocaleDateString('fr-FR', {
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

  useEffect(() => {
    if (showPicker && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPickerPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [showPicker]);

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
        ref={triggerRef}
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252B32]/50 rounded min-h-[28px] text-gray-900 dark:text-[#E0E6ED]"
      >
        <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-[#6B7280]" />
        <span className="flex-1">{formatDate(value)}</span>
        {value && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 dark:text-[#6B7280] dark:hover:text-gray-300 text-xs"
          >
            ×
          </button>
        )}
      </div>

      {showPicker && pickerPos && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowPicker(false)}
          />
          <div
            className="fixed p-3 bg-white dark:bg-[#1E252B] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg z-[9999]"
            style={{ top: pickerPos.top, left: pickerPos.left }}
          >
            <input
              type={includeTime ? 'datetime-local' : 'date'}
              value={formatForInput(value)}
              onChange={handleChange}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-[#3D444D] rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED]"
              autoFocus
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
