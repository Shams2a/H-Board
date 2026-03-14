/**
 * FilterModal Component
 * Modal for managing view filters
 */

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/uuid';
import type { DatabaseProperty, DatabaseFilter, FilterOperator } from '../../types';

interface FilterModalProps {
  properties: DatabaseProperty[];
  filters: DatabaseFilter[];
  onClose: () => void;
  onSave: (filters: DatabaseFilter[]) => void;
}

const FILTER_OPERATORS: Record<string, { label: string; operators: FilterOperator[] }> = {
  text: {
    label: 'Texte',
    operators: ['contains', 'not_contains', 'is', 'is_not', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
  },
  number: {
    label: 'Nombre',
    operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_empty', 'is_not_empty']
  },
  date: {
    label: 'Date',
    operators: ['is_before', 'is_after', 'is_on_or_before', 'is_on_or_after', 'is_empty', 'is_not_empty']
  },
  select: {
    label: 'Selection',
    operators: ['is', 'is_not', 'is_any_of', 'is_none_of', 'is_empty', 'is_not_empty']
  },
  checkbox: {
    label: 'Case a cocher',
    operators: ['is_checked', 'is_not_checked']
  }
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  contains: 'Contient',
  not_contains: 'Ne contient pas',
  is: 'Est',
  is_not: 'N\'est pas',
  starts_with: 'Commence par',
  ends_with: 'Se termine par',
  is_empty: 'Est vide',
  is_not_empty: 'N\'est pas vide',
  equals: 'Egal a',
  not_equals: 'Different de',
  greater_than: 'Superieur a',
  less_than: 'Inferieur a',
  greater_than_or_equal: 'Superieur ou egal a',
  less_than_or_equal: 'Inferieur ou egal a',
  is_before: 'Avant',
  is_after: 'Apres',
  is_on_or_before: 'Le ou avant',
  is_on_or_after: 'Le ou apres',
  is_within: 'Dans',
  past_week: 'Semaine passee',
  past_month: 'Mois passe',
  is_any_of: 'Est l\'un de',
  is_none_of: 'N\'est aucun de',
  is_checked: 'Est coche',
  is_not_checked: 'N\'est pas coche'
};

export default function FilterModal({ properties, filters, onClose, onSave }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<DatabaseFilter[]>(filters);

  const getPropertyType = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (!property) return 'text';

    if (property.type === 'title' || property.type === 'text' || property.type === 'url' ||
        property.type === 'email' || property.type === 'phone') {
      return 'text';
    }
    if (property.type === 'multi_select') {
      return 'select';
    }
    return property.type;
  };

  const getOperatorsForProperty = (propertyId: string): FilterOperator[] => {
    const type = getPropertyType(propertyId);
    return FILTER_OPERATORS[type]?.operators || FILTER_OPERATORS.text.operators;
  };

  const needsValue = (operator: FilterOperator): boolean => {
    return !['is_empty', 'is_not_empty', 'is_checked', 'is_not_checked'].includes(operator);
  };

  const handleAddFilter = () => {
    if (properties.length === 0) return;

    const firstProperty = properties[0];
    const operators = getOperatorsForProperty(firstProperty.id);

    const newFilter: DatabaseFilter = {
      id: generateId(),
      propertyId: firstProperty.id,
      operator: operators[0],
      value: ''
    };

    setLocalFilters([...localFilters, newFilter]);
  };

  const handleUpdateFilter = (id: string, field: keyof DatabaseFilter, value: any) => {
    setLocalFilters(localFilters.map((filter) => {
      if (filter.id === id) {
        // If changing property, reset operator to first valid one
        if (field === 'propertyId') {
          const operators = getOperatorsForProperty(value);
          return { ...filter, propertyId: value, operator: operators[0], value: '' };
        }
        // If changing operator, reset value if new operator doesn't need one
        if (field === 'operator' && !needsValue(value as FilterOperator)) {
          return { ...filter, operator: value, value: '' };
        }
        return { ...filter, [field]: value };
      }
      return filter;
    }));
  };

  const handleDeleteFilter = (id: string) => {
    setLocalFilters(localFilters.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    onSave(localFilters);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1E252B] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#30363D]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E6ED]">
            Filtres
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {localFilters.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-[#B1B9C4] italic text-center py-8">
              Aucun filtre. Cliquez sur "Ajouter un filtre" pour en creer un.
            </p>
          ) : (
            localFilters.map((filter) => {
              properties.find((p) => p.id === filter.propertyId);
              const operators = getOperatorsForProperty(filter.propertyId);
              const showValue = needsValue(filter.operator);

              return (
                <div key={filter.id!} className="flex items-center gap-2">
                  {/* Property selector */}
                  <select
                    value={filter.propertyId}
                    onChange={(e) => handleUpdateFilter(filter.id!, 'propertyId', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#252B32] border border-gray-300 dark:border-[#3D444D] rounded text-sm text-gray-900 dark:text-[#E0E6ED]"
                  >
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>

                  {/* Operator selector */}
                  <select
                    value={filter.operator}
                    onChange={(e) => handleUpdateFilter(filter.id!, 'operator', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#252B32] border border-gray-300 dark:border-[#3D444D] rounded text-sm text-gray-900 dark:text-[#E0E6ED]"
                  >
                    {operators.map((op) => (
                      <option key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </option>
                    ))}
                  </select>

                  {/* Value input */}
                  {showValue && (
                    <input
                      type="text"
                      value={filter.value != null ? String(filter.value) : ''}
                      onChange={(e) => handleUpdateFilter(filter.id!, 'value', e.target.value)}
                      placeholder="Valeur"
                      className="flex-1 px-3 py-2 bg-white dark:bg-[#252B32] border border-gray-300 dark:border-[#3D444D] rounded text-sm text-gray-900 dark:text-[#E0E6ED]"
                    />
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteFilter(filter.id!)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}

          {/* Add filter button */}
          <button
            onClick={handleAddFilter}
            disabled={properties.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border-2 border-dashed border-gray-300 dark:border-[#3D444D] rounded hover:border-primary-500 dark:hover:border-primary-400 text-gray-600 dark:text-[#B1B9C4] hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Ajouter un filtre
          </button>
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
            Appliquer les filtres
          </button>
        </div>
      </div>
    </div>
  );
}
