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
  properties: Record<string, CellValue>; // { propertyId: value } - renamed from "values"
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
  id?: string;              // Optional ID for UI purposes
  propertyId: string;       // Renamed from "property"
  operator: FilterOperator;
  value?: CellValue | CellValue[];  // Made optional for operators like is_empty
}

// Legacy alias for backwards compatibility
export type Filter = DatabaseFilter;

export type SortDirection = 'asc' | 'desc';

export interface DatabaseSort {
  id?: string;              // Optional ID for UI purposes
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
  { type: 'title', label: 'Titre', icon: '📝', description: 'Champ texte principal', availableInMVP: true },
  { type: 'text', label: 'Texte', icon: '📄', description: 'Texte simple', availableInMVP: true },
  { type: 'number', label: 'Nombre', icon: '🔢', description: 'Nombres avec formatage', availableInMVP: true },
  { type: 'select', label: 'Selection', icon: '🏷️', description: 'Choix unique', availableInMVP: true },
  { type: 'multi_select', label: 'Multi-selection', icon: '🏷️', description: 'Choix multiples', availableInMVP: true },
  { type: 'date', label: 'Date', icon: '📅', description: 'Date et/ou heure', availableInMVP: true },
  { type: 'checkbox', label: 'Case a cocher', icon: '☑️', description: 'Oui/Non', availableInMVP: true },
  { type: 'url', label: 'URL', icon: '🔗', description: 'Liens web', availableInMVP: true },
  { type: 'email', label: 'Email', icon: '📧', description: 'Adresses email', availableInMVP: true },
  { type: 'phone', label: 'Telephone', icon: '📞', description: 'Numeros de telephone', availableInMVP: true },
  { type: 'board', label: 'Projet', icon: '📋', description: 'Lien vers un projet', availableInMVP: true },

  // Advanced Types (Phase 4.2)
  { type: 'file', label: 'Fichiers', icon: '📎', description: 'Pieces jointes', availableInMVP: false },
  { type: 'person', label: 'Personne', icon: '👤', description: 'Assignation utilisateur', availableInMVP: false },
  { type: 'formula', label: 'Formule', icon: 'ƒ', description: 'Valeurs calculees', availableInMVP: false },
  { type: 'relation', label: 'Relation', icon: '🔗', description: 'Liens vers d\'autres bases', availableInMVP: false },
  { type: 'rollup', label: 'Agregation', icon: '∑', description: 'Agregations', availableInMVP: false },
  { type: 'created_time', label: 'Date de creation', icon: '🕐', description: 'Auto : date de creation', availableInMVP: false },
  { type: 'created_by', label: 'Cree par', icon: '👤', description: 'Auto : createur', availableInMVP: false },
  { type: 'last_edited_time', label: 'Derniere modification', icon: '🕐', description: 'Auto : date de modification', availableInMVP: false },
  { type: 'last_edited_by', label: 'Modifie par', icon: '👤', description: 'Auto : editeur', availableInMVP: false },
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

export const validateCellValue = (value: CellValue, property: DatabaseProperty): boolean => {
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

export const getDefaultCellValue = (type: PropertyType): CellValue => {
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
