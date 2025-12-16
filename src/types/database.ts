/**
 * Database Types
 * Type definitions for Database board functionality (Notion-like)
 */

export type PropertyType =
  // MVP Types
  | 'title'           // Primary text field (required, one per database)
  | 'text'            // Simple text
  | 'number'          // Numbers with formatting
  | 'select'          // Single choice
  | 'multi_select'    // Multiple choices (renamed from multi-select)
  | 'date'            // Date and/or time
  | 'checkbox'        // Boolean
  | 'url'             // Web links
  | 'email'           // Email addresses
  | 'phone'           // Phone numbers (NEW)
  | 'board'           // Link to any board (Canvas, Kanban, Database)
  // Advanced Types (Phase 4.2)
  | 'file'            // File attachments
  | 'person'          // User assignments (NEW)
  | 'formula'         // Calculated values
  | 'relation'        // Links to other databases (NEW)
  | 'rollup'          // Aggregations from relations (NEW)
  | 'created_time'    // Auto: creation timestamp (renamed from created-time)
  | 'created_by'      // Auto: creator user (NEW)
  | 'last_edited_time'  // Auto: last edit timestamp (renamed from last-edited-time)
  | 'last_edited_by';   // Auto: last editor user (NEW)

export type ViewType = 'table' | 'list' | 'board' | 'calendar' | 'gallery';

export type NumberFormatType = 'number' | 'decimal' | 'percentage' | 'currency';
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'relative';

export interface NumberFormat {
  type: NumberFormatType;
  decimals?: number;      // Number of decimal places (0-10)
  currency?: string;      // Currency code (USD, EUR, GBP, etc.)
}

export interface SelectOption {
  id: string;
  name: string;
  color: string; // Hex color code
}

export interface PropertyConfig {
  // For Select/Multi-select
  options?: SelectOption[];

  // For Number
  numberFormat?: NumberFormat;

  // For Date
  dateFormat?: DateFormat;
  includeTime?: boolean;

  // For Formula
  formula?: string;

  // For Relation
  relationDatabaseId?: string;

  // For Rollup
  rollupRelationId?: string;
  rollupPropertyId?: string;
  rollupFunction?: 'count' | 'sum' | 'average' | 'min' | 'max';
}

export interface DatabaseProperty {
  id: string;
  boardId: string;
  name: string;
  type: PropertyType;
  config?: PropertyConfig;  // Made optional
  position: number;

  // Display options
  required?: boolean;
  width?: number;           // Column width in pixels (default: 200)
  visible?: boolean;        // Show/hide in views (default: true)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseRow {
  id: string;
  boardId: string;
  properties: Record<string, any>; // { propertyId: value } - renamed from "values"
  position: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;       // User ID
  lastEditedBy?: string;    // User ID
}

export type FilterOperator =
  // Common
  | 'equals'
  | 'not_equals'
  | 'is_empty'
  | 'is_not_empty'
  // Text
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is'
  | 'is_not'
  // Number & Date
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  // Date specific
  | 'is_before'
  | 'is_after'
  | 'is_on_or_before'
  | 'is_on_or_after'
  | 'is_within'
  | 'past_week'
  | 'past_month'
  // Select
  | 'is_any_of'
  | 'is_none_of'
  // Checkbox
  | 'is_checked'
  | 'is_not_checked';

export interface DatabaseFilter {
  propertyId: string;       // Renamed from "property"
  operator: FilterOperator;
  value?: any;              // Made optional for operators like is_empty
}

// Legacy alias for backwards compatibility
export type Filter = DatabaseFilter;

export type SortDirection = 'asc' | 'desc';

export interface DatabaseSort {
  propertyId: string;       // Renamed from "property"
  direction: SortDirection;
}

// Legacy alias for backwards compatibility
export type Sort = DatabaseSort;

export interface ViewConfig {
  // For Table view
  visibleProperties?: string[];
  propertyOrder?: string[];

  // For Kanban view
  groupByProperty?: string; // property ID (must be Select type)
  cardCoverProperty?: string; // property ID (File type)

  // For Gallery view
  cardSize?: 'small' | 'medium' | 'large';
  coverProperty?: string; // property ID (File type)

  // For Calendar view
  dateProperty?: string; // property ID (Date type)
  colorByProperty?: string; // property ID (Select type)
}

export interface DatabaseView {
  id: string;
  boardId: string;
  name: string;
  type: ViewType;

  // View configuration
  filters: DatabaseFilter[];
  sorts: DatabaseSort[];
  groupBy?: string;                // propertyId to group by
  visibleProperties: string[];     // propertyId[] shown in this view
  config?: ViewConfig;             // Additional type-specific config (made optional)

  // Display options
  position: number;
  isDefault: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface Database {
  properties: DatabaseProperty[];
  rows: DatabaseRow[];
  views: DatabaseView[];
}

// ============================================================================
// HELPER TYPES & UTILITIES
// ============================================================================

export interface PropertyTypeInfo {
  type: PropertyType;
  label: string;
  icon: string;
  description: string;
  availableInMVP: boolean;
}

export const PROPERTY_TYPES: PropertyTypeInfo[] = [
  // MVP Types
  { type: 'title', label: 'Title', icon: '📝', description: 'Primary text field', availableInMVP: true },
  { type: 'text', label: 'Text', icon: '📄', description: 'Plain text', availableInMVP: true },
  { type: 'number', label: 'Number', icon: '🔢', description: 'Numbers with formatting', availableInMVP: true },
  { type: 'select', label: 'Select', icon: '🏷️', description: 'Single choice', availableInMVP: true },
  { type: 'multi_select', label: 'Multi-select', icon: '🏷️', description: 'Multiple choices', availableInMVP: true },
  { type: 'date', label: 'Date', icon: '📅', description: 'Date and/or time', availableInMVP: true },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️', description: 'Yes/No checkbox', availableInMVP: true },
  { type: 'url', label: 'URL', icon: '🔗', description: 'Web links', availableInMVP: true },
  { type: 'email', label: 'Email', icon: '📧', description: 'Email addresses', availableInMVP: true },
  { type: 'phone', label: 'Phone', icon: '📞', description: 'Phone numbers', availableInMVP: true },
  { type: 'board', label: 'Board', icon: '📋', description: 'Link to a board', availableInMVP: true },

  // Advanced Types (Phase 4.2)
  { type: 'file', label: 'Files', icon: '📎', description: 'File attachments', availableInMVP: false },
  { type: 'person', label: 'Person', icon: '👤', description: 'User assignments', availableInMVP: false },
  { type: 'formula', label: 'Formula', icon: 'ƒ', description: 'Calculated values', availableInMVP: false },
  { type: 'relation', label: 'Relation', icon: '🔗', description: 'Links to other databases', availableInMVP: false },
  { type: 'rollup', label: 'Rollup', icon: '∑', description: 'Aggregations', availableInMVP: false },
  { type: 'created_time', label: 'Created time', icon: '🕐', description: 'Auto: creation date', availableInMVP: false },
  { type: 'created_by', label: 'Created by', icon: '👤', description: 'Auto: creator', availableInMVP: false },
  { type: 'last_edited_time', label: 'Last edited time', icon: '🕐', description: 'Auto: edit date', availableInMVP: false },
  { type: 'last_edited_by', label: 'Last edited by', icon: '👤', description: 'Auto: editor', availableInMVP: false },
];

// Helper to get available property types for MVP
export const getMVPPropertyTypes = (): PropertyTypeInfo[] => {
  return PROPERTY_TYPES.filter(pt => pt.availableInMVP);
};

// Helper to get property type info
export const getPropertyTypeInfo = (type: PropertyType): PropertyTypeInfo | undefined => {
  return PROPERTY_TYPES.find(pt => pt.type === type);
};

// ============================================================================
// CELL VALUE TYPES
// ============================================================================

export type CellValue =
  | string                    // title, text, url, email, phone
  | number                    // number
  | boolean                   // checkbox
  | Date                      // date
  | string[]                  // multi_select, file, person
  | SelectOption              // select
  | SelectOption[]            // multi_select (with full objects)
  | null
  | undefined;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateCellValue = (value: any, property: DatabaseProperty): boolean => {
  switch (property.type) {
    case 'title':
    case 'text':
    case 'url':
    case 'email':
    case 'phone':
      return typeof value === 'string' || value === null || value === undefined;

    case 'number':
      return typeof value === 'number' || value === null || value === undefined;

    case 'checkbox':
      return typeof value === 'boolean' || value === null || value === undefined;

    case 'date':
      return value instanceof Date || typeof value === 'string' || value === null || value === undefined;

    case 'select':
      return typeof value === 'string' || value === null || value === undefined;

    case 'multi_select':
      return Array.isArray(value) || value === null || value === undefined;

    default:
      return true;
  }
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const getDefaultCellValue = (type: PropertyType): any => {
  switch (type) {
    case 'title':
    case 'text':
    case 'url':
    case 'email':
    case 'phone':
      return '';

    case 'number':
      return null;

    case 'checkbox':
      return false;

    case 'date':
      return null;

    case 'select':
      return null;

    case 'multi_select':
      return [];

    default:
      return null;
  }
};
