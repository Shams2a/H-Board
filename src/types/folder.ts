/**
 * Folder type definition
 * Represents a folder to organize boards
 */

export interface Folder {
  id: string;
  name: string;
  color?: string;
  parentFolderId: string | null; // Support for nested folders
  createdAt: Date;
  updatedAt: Date;
}
