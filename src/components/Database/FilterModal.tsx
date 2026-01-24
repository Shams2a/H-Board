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
    label: 'Text',
    operators: ['contains', 'not_contains', 'is', 'is_not', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
  },
  number: {
    label: 'Number',
    operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_empty', 'is_not_empty']
  },
  date: {
    label: 'Date',
    operators: ['is_before', 'is_after', 'is_on_or_before', 'is_on_or_after', 'is_empty', 'is_not_empty']
  },
  select: {
    label: 'Select',
    operators: ['is', 'is_not', 'is_any_of', 'is_none_of', 'is_empty', 'is_not_empty']
  },
  checkbox: {
    label: 'Checkbox',
    operators: ['is_checked', 'is_not_checked']
  }
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  contains: 'Contains',
  not_contains: 'Does not contain',
  is: 'Is',
  is_not: 'Is not',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  is_empty: 'Is empty',
  is_not_empty: 'Is not empty',
  equals: 'Equals',
  not_equals: 'Does not equal',
  greater_than: 'Greater than',
  less_than: 'Less than',
  greater_than_or_equal: 'Greater than or equal to',
  less_than_or_equal: 'Less than or equal to',
  is_before: 'Is before',
  is_after: 'Is after',
  is_on_or_before: 'Is on or before',
  is_on_or_after: 'Is on or after',
  is_within: 'Is within',
  past_week: 'Past week',
  past_month: 'Past month',
  is_any_of: 'Is any of',
  is_none_of: 'Is none of',
  is_checked: 'Is checked',
  is_not_checked: 'Is not checked'
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filters
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
            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
              No filters yet. Click "Add Filter" to create one.
            </p>
          ) : (
            localFilters.map((filter) => {
              const property = properties.find((p) => p.id === filter.propertyId);
              const operators = getOperatorsForProperty(filter.propertyId);
              const showValue = needsValue(filter.operator);

              return (
                <div key={filter.id!} className="flex items-center gap-2">
                  {/* Property selector */}
                  <select
                    value={filter.propertyId}
                    onChange={(e) => handleUpdateFilter(filter.id!, 'propertyId', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
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
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
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
                      value={filter.value}
                      onChange={(e) => handleUpdateFilter(filter.id!, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-primary-500 dark:hover:border-primary-400 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Filter
          </button>
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
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
