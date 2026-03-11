/**
 * FilterControls Component
 * Filters for elements by type, date, and tags
 */

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ElementType } from '../../types';

interface FilterControlsProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  types: ElementType[];
  dateRange?: { start: Date; end: Date };
  tags: string[];
}

const ELEMENT_TYPES: { value: ElementType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'image', label: 'Image' },
  { value: 'column', label: 'Column' },
  { value: 'line', label: 'Line' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'link', label: 'Link' },
  { value: 'file', label: 'File' },
  { value: 'todo', label: 'Todo' },
  { value: 'table', label: 'Table' },
];

export default function FilterControls({ onFilterChange }: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<ElementType[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleTypeToggle = (type: ElementType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];

    setSelectedTypes(newTypes);
    updateFilters(newTypes, startDate, endDate, tags);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput('');
      updateFilters(selectedTypes, startDate, endDate, newTags);
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    updateFilters(selectedTypes, startDate, endDate, newTags);
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    updateFilters(selectedTypes, start, end, tags);
  };

  const updateFilters = (types: ElementType[], start: string, end: string, filterTags: string[]) => {
    const filters: FilterState = {
      types,
      tags: filterTags,
    };

    if (start && end) {
      filters.dateRange = {
        start: new Date(start),
        end: new Date(end),
      };
    }

    onFilterChange(filters);
  };

  const handleReset = () => {
    setSelectedTypes([]);
    setStartDate('');
    setEndDate('');
    setTags([]);
    setTagInput('');
    onFilterChange({ types: [], tags: [] });
  };

  const hasActiveFilters = selectedTypes.length > 0 || startDate || endDate || tags.length > 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
              {selectedTypes.length + tags.length + (startDate && endDate ? 1 : 0)}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-3 space-y-4 bg-white">
          {/* Element Types */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Element Type
            </label>
            <div className="space-y-1">
              {ELEMENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => handleTypeToggle(type.value)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange(e.target.value, endDate)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Start date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange(startDate, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="End date"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add tag..."
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
