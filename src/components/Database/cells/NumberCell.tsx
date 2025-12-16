/**
 * NumberCell Component
 * Number editor with formatting (number, decimal, percentage, currency)
 */

import { useState, useRef, useEffect } from 'react';
import type { NumberFormat } from '../../../types/database';

interface NumberCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  format?: NumberFormat;
}

export default function NumberCell({ value, onChange, format }: NumberCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = editValue.trim() === '' ? null : parseFloat(editValue);

    if (numValue !== value && !isNaN(numValue as number)) {
      onChange(numValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  // Format number for display
  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return '';

    const formatType = format?.type || 'number';
    const decimals = format?.decimals ?? 0;

    switch (formatType) {
      case 'percentage':
        return `${num.toFixed(decimals)}%`;
      case 'currency':
        const currency = format?.currency || 'USD';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(num);
      case 'decimal':
        return num.toFixed(decimals);
      case 'number':
      default:
        return num.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="any"
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
        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-primary-500 dark:border-primary-400 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-900 dark:text-gray-100"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full px-2 py-1 text-sm cursor-text hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded min-h-[28px] text-right text-gray-900 dark:text-gray-100"
    >
      {formatNumber(value)}
    </div>
  );
}
