/**
 * MultiSelectCell Component
 * Multi-select dropdown with colored tags and text labels
 */

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { SelectOption } from '../../../types/database';

interface MultiSelectCellProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
}

export default function MultiSelectCell({ value = [], onChange, options = [] }: MultiSelectCellProps) {
  const [showMenu, setShowMenu] = useState(false);

  const selectedOptions = value
    .map(v => options.find(opt => opt.id === v || opt.name === v))
    .filter(Boolean) as SelectOption[];

  const handleToggle = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter(v => v !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  const handleRemove = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionId));
  };

  return (
    <div className="relative w-full">
      <div
        onClick={() => setShowMenu(!showMenu)}
        className="flex flex-wrap items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252B32]/50 rounded min-h-[28px]"
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <div
              key={option.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-[#252B32]"
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
              <span className="text-xs font-medium" style={{ color: '#111827' }}>
                {option.name}
              </span>
              <button
                onClick={(e) => handleRemove(e, option.id)}
                className="hover:bg-gray-200 dark:hover:bg-[#2C333A] rounded p-0.5 flex-shrink-0"
                title="Remove"
              >
                <X className="w-3 h-3 text-gray-500 dark:text-[#B1B9C4]" />
              </button>
            </div>
          ))
        ) : (
          <span className="text-gray-400 dark:text-[#6B7280]">Select...</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-[#6B7280] ml-auto" />
      </div>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] max-h-64 overflow-y-auto bg-white dark:bg-[#1E252B] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg z-50 py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#B1B9C4] italic">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleToggle(option.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#252B32] flex items-center gap-2 ${
                      isSelected ? 'bg-gray-50 dark:bg-[#252B32]/50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-primary-600 dark:text-primary-500 border-gray-300 dark:border-[#3D444D] rounded focus:ring-primary-500 dark:focus:ring-primary-400"
                    />
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                    <span className="text-sm font-medium text-gray-900 dark:text-[#E0E6ED]">
                      {option.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
