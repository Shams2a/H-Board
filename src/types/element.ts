/**
 * Element type definitions
 * Represents all possible elements that can be placed on the canvas
 */

export type ElementType =
  | 'note'
  | 'image'
  | 'column'
  | 'board'
  | 'section'
  | 'line'
  | 'arrow'
  | 'drawing'
  | 'link'
  | 'file'
  | 'todo'
  | 'table'
  | 'shape';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  rotation?: number;
  // Typography properties (for Note elements)
  fontSize?: number | string; // Can be number or Tailwind class like 'text-lg'
  fontFamily?: string;
  lineHeight?: number | string; // Can be number or Tailwind class
  letterSpacing?: number | string; // Can be number or Tailwind class
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface BaseElement {
  id: string;
  boardId: string;
  type: ElementType;
  position: Position;
  size: Size;
  zIndex: number;
  locked: boolean;
  parentId?: string; // For elements inside a column
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;  // Soft delete timestamp
  style: ElementStyle;
  // Re-use / Reference system
  sourceElementId?: string; // If set, this is a reference to another element
  isReusable?: boolean;     // Marks element as reusable template
}

// Specific element content types

export interface NoteContent {
  title?: string;
  text: string; // TipTap JSON or HTML
  textFormat: 'html' | 'markdown';
}

export interface ImageContent {
  src: string; // base64 or URL
  alt?: string;
  originalName?: string;
}

export interface ColumnContent {
  title: string;
  childrenIds: string[];
  maxWidth?: number;
  collapsed?: boolean;
}

export interface BoardLinkContent {
  linkedBoardId: string;
  title: string;
  description?: string;
  thumbnailData?: string;
  elementCount?: number;
}

export interface SectionContent {
  title?: string;
  collapsed?: boolean;
}

export interface LineContent {
  startElementId?: string;
  endElementId?: string;
  startPoint: Position;
  endPoint: Position;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  arrowStart?: boolean;
  arrowEnd?: boolean;
  curvePoints?: Position[]; // Bezier curve control points
  label?: string; // Optional text label shown at middle of line
}

export type AnchorPosition = 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left' | 'center';
export type ArrowPathType = 'curved' | 'straight' | 'elbow' | 'step';
export type ArrowHeadStyle = 'triangle' | 'triangle-filled' | 'diamond' | 'circle' | 'bar' | 'none';

export interface ArrowContent {
  startElementId: string;
  endElementId: string;
  startAnchor: AnchorPosition;
  endAnchor: AnchorPosition;
  pathType: ArrowPathType;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  arrowHeadStart?: ArrowHeadStyle;
  arrowHeadEnd?: ArrowHeadStyle;
  label?: string;
  animated?: boolean; // For flow animation
  color?: string;
  thickness?: number;
}

export interface DrawingContent {
  paths: DrawingPath[];
}

export interface DrawingPath {
  points: Position[];
  color: string;
  thickness: number;
  tool: 'pen' | 'eraser';
}

export interface LinkContent {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  favicon?: string;
}

export interface FileContent {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64
}

export interface TodoItem {
  id: string;
  text: string;
  checked: boolean;
  order: number;
}

export interface TodoListContent {
  title?: string;
  items: TodoItem[];
  showProgress: boolean;
}

export type CellType = 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';

export interface TableCellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
}

export type TableCellValue = string | number | boolean | null;

export interface TableCell {
  value: TableCellValue;
  type: CellType;
  formula?: string;
  style?: TableCellStyle;
}

export interface TableContent {
  headers: string[];
  rows: TableCell[][];
  columnWidths?: number[]; // Width in pixels for each column
  columnTypes?: CellType[]; // Type for each column (index-based)
  columnDropdownOptions?: Record<number, string[]>; // Dropdown options per column index
}

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'star';

export interface ShapeContent {
  shapeType: ShapeType;
}

// Union type for all element types with their specific content

export type NoteElement = BaseElement & { type: 'note'; content: NoteContent };
export type ImageElement = BaseElement & { type: 'image'; content: ImageContent };
export type ColumnElement = BaseElement & { type: 'column'; content: ColumnContent };
export type BoardElement = BaseElement & { type: 'board'; content: BoardLinkContent };
export type SectionElement = BaseElement & { type: 'section'; content: SectionContent };
export type LineElement = BaseElement & { type: 'line'; content: LineContent };
export type ArrowElement = BaseElement & { type: 'arrow'; content: ArrowContent };
export type DrawingElement = BaseElement & { type: 'drawing'; content: DrawingContent };
export type LinkElement = BaseElement & { type: 'link'; content: LinkContent };
export type FileElement = BaseElement & { type: 'file'; content: FileContent };
export type TodoElement = BaseElement & { type: 'todo'; content: TodoListContent };
export type TableElement = BaseElement & { type: 'table'; content: TableContent };
export type ShapeElement = BaseElement & { type: 'shape'; content: ShapeContent };

export type Element =
  | NoteElement
  | ImageElement
  | ColumnElement
  | BoardElement
  | SectionElement
  | LineElement
  | ArrowElement
  | DrawingElement
  | LinkElement
  | FileElement
  | TodoElement
  | TableElement
  | ShapeElement;
