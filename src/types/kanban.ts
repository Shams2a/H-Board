/**
 * Kanban Types
 * Type definitions for Kanban board functionality
 */

export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanColumn {
  id: string;
  boardId: string;
  name: string;
  color: string; // Hex color code
  position: number;
  wipLimit?: number; // Work In Progress limit (optional)
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string; // URL or base64
  size: number; // bytes
  type: string; // MIME type
  uploadedAt: Date;
}

export interface KanbanCard {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string; // Rich text HTML
  position: number;

  // Metadata
  tags: string[];
  priority: KanbanPriority;

  // Dates
  dueDate?: Date;
  startDate?: Date;

  // Attachments
  coverImage?: string; // URL or base64
  attachments: Attachment[];

  // Checklist
  checklist: ChecklistItem[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanFilters {
  searchQuery?: string;
  tags?: string[];
  priorities?: KanbanPriority[];
  dateFilter?: 'overdue' | 'thisWeek' | 'noDate' | 'all';
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  cards: KanbanCard[];
}
