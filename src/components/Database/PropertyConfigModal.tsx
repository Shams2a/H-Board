/**
 * PropertyConfigModal Component
 * Modal for editing property configuration (number format, select options, etc.)
 */

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/uuid';
import type { DatabaseProperty, PropertyConfig, SelectOption } from '../../types';

interface PropertyConfigModalProps {
  property: DatabaseProperty;
  onClose: () => void;
  onSave: (config: PropertyConfig) => void;
}

const NUMBER_FORMATS = [
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'currency', label: 'Currency' }
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

const COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#84CC16'
];

export default function PropertyConfigModal({ property, onClose, onSave }: PropertyConfigModalProps) {
  const [config, setConfig] = useState<PropertyConfig>(property.config || {});

  // Number format configuration
  const handleNumberFormatChange = (field: string, value: any) => {
    setConfig({
      ...config,
      numberFormat: {
        ...config.numberFormat,
        [field]: value
      }
    });
  };

  // Date configuration
  const handleDateConfigChange = (includeTime: boolean) => {
    setConfig({
      ...config,
      includeTime
    });
  };

  // Select options management
  const handleAddOption = () => {
    const newOption: SelectOption = {
      id: generateId(),
      name: 'New Option',
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };

    setConfig({
      ...config,
      options: [...(config.options || []), newOption]
    });
  };

  const handleUpdateOption = (id: string, field: keyof SelectOption, value: string) => {
    setConfig({
      ...config,
      options: (config.options || []).map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    });
  };

  const handleDeleteOption = (id: string) => {
    setConfig({
      ...config,
      options: (config.options || []).filter((opt) => opt.id !== id)
    });
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Configure Property: {property.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Number format configuration */}
          {property.type === 'number' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Number Format
              </h3>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Format Type
                </label>
                <select
                  value={config.numberFormat?.type || 'number'}
                  onChange={(e) => handleNumberFormatChange('type', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                >
                  {NUMBER_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Decimal Places
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={config.numberFormat?.decimals ?? 0}
                  onChange={(e) => handleNumberFormatChange('decimals', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
              </div>

              {config.numberFormat?.type === 'currency' && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={config.numberFormat?.currency || 'USD'}
                    onChange={(e) => handleNumberFormatChange('currency', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Date configuration */}
          {property.type === 'date' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Date Format
              </h3>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.includeTime || false}
                  onChange={(e) => handleDateConfigChange(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include Time
                </span>
              </label>
            </div>
          )}

          {/* Select/MultiSelect options */}
          {(property.type === 'select' || property.type === 'multi_select') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Options
                </h3>
                <button
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <Plus className="w-3 h-3" />
                  Add Option
                </button>
              </div>

              <div className="space-y-2">
                {(config.options || []).map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={option.color}
                      onChange={(e) => handleUpdateOption(option.id, 'color', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => handleUpdateOption(option.id, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                      placeholder="Option name"
                    />
                    <button
                      onClick={() => handleDeleteOption(option.id)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {(!config.options || config.options.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
                    No options yet. Click "Add Option" to create one.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* No configuration needed */}
          {!['number', 'date', 'select', 'multi_select'].includes(property.type) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No configuration options available for this property type.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
