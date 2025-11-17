/**
 * Board type definition
 * Represents a canvas workspace in H-Board
 */
export interface Board {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  settings: BoardSettings;
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
