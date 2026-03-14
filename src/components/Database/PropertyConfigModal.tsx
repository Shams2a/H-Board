/**
 * PropertyConfigModal Component
 * Modal for editing property configuration (number format, select options, etc.)
 */

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/uuid';
import type { DatabaseProperty, PropertyConfig, SelectOption } from '../../types';

interface PropertyConfigModalProps {
  property: DatabaseProperty;
  onClose: () => void;
  onSave: (config: PropertyConfig) => void;
}

const NUMBER_FORMATS = [
  { value: 'number', label: 'Nombre' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'percentage', label: 'Pourcentage' },
  { value: 'currency', label: 'Devise' }
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
        type: config.numberFormat?.type || 'number',
        decimals: config.numberFormat?.decimals,
        currency: config.numberFormat?.currency,
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
      name: 'Nouvelle option',
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
        className="bg-white dark:bg-[#1E252B] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#30363D]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E6ED]">
            Configurer : {property.name}
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
              <h3 className="text-sm font-medium text-gray-900 dark:text-[#E0E6ED]">
                Format du nombre
              </h3>

              <div>
                <label className="block text-xs text-gray-600 dark:text-[#B1B9C4] mb-1">
                  Type de format
                </label>
                <select
                  value={config.numberFormat?.type || 'number'}
                  onChange={(e) => handleNumberFormatChange('type', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#252B32] border border-gray-300 dark:border-[#3D444D] rounded text-sm text-gray-900 dark:text-[#E0E6ED]"
                >
                  {NUMBER_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-[#B1B9C4] mb-1">
                  Decimales
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={config.numberFormat?.decimals ?? 0}
                  onChange={(e) => handleNumberFormatChange('decimals', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#252B32] border border-gray-300 dark:border-[#3D444D] rounded text-sm text-gray-900 dark:text-[#E0E6ED]"
                />
              </div>

              {config.numberFormat?.type === 'currency' && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-[#B1B9C4] mb-1">
                    Devise
                  </label>
                  <select
                    value={config.numberFormat?.currency || 'USD'}
                    onChange={(e) => handleNumberFormatChange('currency', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#252B32] border border-gray-300 dark:border-[#3D444D] rounded text-sm text-gray-900 dark:text-[#E0E6ED]"
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
              <h3 className="text-sm font-medium text-gray-900 dark:text-[#E0E6ED]">
                Format de date
              </h3>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.includeTime || false}
                  onChange={(e) => handleDateConfigChange(e.target.checked)}
                  className="rounded border-gray-300 dark:border-[#3D444D] text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-[#B1B9C4]">
                  Inclure l'heure
                </span>
              </label>
            </div>
          )}

          {/* Select/MultiSelect options */}
          {(property.type === 'select' || property.type === 'multi_select') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-[#E0E6ED]">
                  Options de selection
                </h3>
                <button
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter une option
                </button>
              </div>

              <div className="space-y-2">
                {(config.options || []).map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={option.color}
                      onChange={(e) => handleUpdateOption(option.id, 'color', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 dark:border-[#3D444D] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => handleUpdateOption(option.id, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-[#252B32] border border-gray-300 dark:border-[#3D444D] rounded text-sm text-gray-900 dark:text-[#E0E6ED]"
                      placeholder="Nom de l'option"
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
                  <p className="text-sm text-gray-500 dark:text-[#B1B9C4] italic text-center py-4">
                    Aucune option. Cliquez sur "Ajouter une option" pour en creer une.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* No configuration needed */}
          {!['number', 'date', 'select', 'multi_select'].includes(property.type) && (
            <p className="text-sm text-gray-500 dark:text-[#B1B9C4] italic">
              Aucune option de configuration disponible pour ce type de propriete.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-[#30363D]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-[#B1B9C4] hover:bg-gray-100 dark:hover:bg-[#252B32] rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
