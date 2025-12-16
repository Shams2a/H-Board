/**
 * Board type definition
 * Represents a workspace in H-Board (Canvas, Kanban, or Database)
 */

export type BoardType = 'canvas' | 'kanban' | 'database';

export interface Board {
  id: string;
  name: string;
  type: BoardType; // Type of board: canvas (infinite canvas), kanban, or database
  description?: string;
  tags: string[];
  folderId: string | null; // Folder organization
  parentId: string | null; // Sub-board hierarchy
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;  // Soft delete timestamp
  settings: BoardSettings;

  // Champs pour la gestion du cache (optionnels)
  lastAccess?: Date;        // Dernière fois que le board a été ouvert
}

export interface BoardSettings {
  gridEnabled: boolean;
  gridSize: number;
  backgroundColor: string;
  zoom: number;
  panX: number;
  panY: number;
}

export interface BoardMetadata {
  elementCount: number;
  lastModified: Date;
  isRoot: boolean;
}
