/**
 * Drag and Drop utilities
 * Handles logic for moving boards into folders
 */

import type { Board, Folder } from '../types';

// Define the event type structure from @dnd-kit/core
export type DragEndEvent = {
  active: {
    id: string | number;
    data: {
      current?: any;
    };
  };
  over: {
    id: string | number;
    data: {
      current?: any;
    };
  } | null;
};

export interface DragData {
  type: 'board' | 'folder';
  board?: Board;
  folder?: Folder;
}

export interface DropData {
  type: 'folder' | 'root';
  folder?: Folder;
}

/**
 * Handle drag end event
 * Returns the board ID and new folder ID if a valid drop occurred
 */
export function handleDragEnd(event: DragEndEvent): {
  boardId: string;
  newFolderId: string | null;
} | null {
  const { active, over } = event;

  if (!over) return null;

  const dragData = active.data.current as DragData;
  const dropData = over.data.current as DropData;

  // Only handle board drops
  if (dragData?.type !== 'board' || !dragData.board) return null;

  const board = dragData.board;

  // Handle board being dropped into folder
  if (dropData?.type === 'folder' && dropData.folder) {
    const folder = dropData.folder;

    // Don't move if already in this folder
    if (board.folderId === folder.id) return null;

    return {
      boardId: board.id,
      newFolderId: folder.id
    };
  }

  // Handle board being dropped to root
  if (dropData?.type === 'root') {
    // Don't move if already at root
    if (board.folderId === null) return null;

    return {
      boardId: board.id,
      newFolderId: null
    };
  }

  return null;
}

/**
 * Group boards by folder
 */
export function groupBoardsByFolder(
  boards: Board[],
  folders: Folder[]
): {
  rootBoards: Board[];
  folderBoards: Map<string, Board[]>;
} {
  const rootBoards: Board[] = [];
  const folderBoards = new Map<string, Board[]>();

  // Initialize map with all folders
  folders.forEach(folder => {
    folderBoards.set(folder.id, []);
  });

  // Group boards
  boards.forEach(board => {
    // Only show root boards (not sub-boards)
    if (board.parentId !== null) return;

    if (board.folderId === null) {
      rootBoards.push(board);
    } else if (folderBoards.has(board.folderId)) {
      folderBoards.get(board.folderId)!.push(board);
    }
  });

  return { rootBoards, folderBoards };
}
