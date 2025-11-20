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

export interface TableCell {
  value: any;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';
  formula?: string;
  style?: any;
}

export interface TableContent {
  headers: string[];
  rows: TableCell[][];
  columnWidths?: number[];
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
  | DrawingElement
  | LinkElement
  | FileElement
  | TodoElement
  | TableElement
  | ShapeElement;
