/**
 * SelectCell Component
 * Single-select dropdown with colored options and text labels
 */

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { SelectOption } from '../../../types/database';

interface SelectCellProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
}

export default function SelectCell({ value, onChange, options = [] }: SelectCellProps) {
  const [showMenu, setShowMenu] = useState(false);

  const selectedOption = options.find(opt => opt.id === value || opt.name === value);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setShowMenu(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setShowMenu(false);
  };

  return (
    <div className="relative w-full">
      <div
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded min-h-[28px]"
      >
        {selectedOption ? (
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700" style={{ minWidth: '100px' }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedOption.color }} />
            <span className="text-sm font-medium" style={{ color: '#111827', flex: 1 }}>
              {selectedOption.name}
            </span>
            <button
              onClick={handleClear}
              className="ml-auto hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5 flex-shrink-0"
              title="Clear"
            >
              <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 flex-1">Select...</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 ml-auto" />
      </div>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {option.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
