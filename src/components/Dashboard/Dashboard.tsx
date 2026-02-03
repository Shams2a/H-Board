/**
 * Dashboard Component
 * Main view showing all boards with filters and search
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, SlidersHorizontal, X, Grid3x3, List, FolderPlus } from 'lucide-react';
import { DndContext } from '@dnd-kit/core';
import { useBoardStore, useFolderStore } from '../../store';
import BoardCard from './BoardCard';
import BoardEditModal from './BoardEditModal';
import BoardTypeSelector from './BoardTypeSelector';
import FolderItem from './FolderItem';
import FolderEditModal from './FolderEditModal';
import RootBoardsZone from './RootBoardsZone';
import { handleDragEnd, groupBoardsByFolder, type DragEndEvent } from '../../utils/dragAndDrop';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { NewSyncStatus } from '../SyncStatus/NewSyncStatus';
import { UserMenu } from '../Auth';
import { newSyncService } from '../../services/supabase/newSyncService';
import type { Board, Folder, BoardType } from '../../types';

type SortBy = 'name' | 'created' | 'updated';
type ViewMode = 'grid' | 'list';

export default function Dashboard() {
  const { boards, loadBoards, createBoard, updateBoard, getAllTags } = useBoardStore();
  const { folders, loadFolders } = useFolderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewBoardDialog, setShowNewBoardDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  useEffect(() => {
    loadBoards();
    loadFolders();
  }, [loadBoards, loadFolders]);

  // Exit fullscreen when returning to dashboard
  useEffect(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  // Refresh stores when sync downloads new data
  useEffect(() => {
    const unsubscribe = newSyncService.onSyncComplete((hasNewData) => {
      if (hasNewData) {
        loadBoards();
        loadFolders();
      }
    });
    return unsubscribe;
  }, [loadBoards, loadFolders]);

  const allTags = useMemo(() => getAllTags(), [boards]);

  // Filter and sort boards
  const filteredBoards = useMemo(() => {
    let filtered = boards.filter((board) => {
      // Root boards only (non sub-boards)
      if (board.parentId !== null) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = board.name.toLowerCase().includes(query);
        const matchesDescription = board.description?.toLowerCase().includes(query);
        const matchesTags = board.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
        if (!matchesName && !matchesDescription && !matchesTags) return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some(tag => board.tags?.includes(tag));
        if (!hasSelectedTag) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  }, [boards, searchQuery, selectedTags, sortBy]);

  const handleCreateBoard = async (name: string, type: BoardType) => {
    await createBoard(name, type);
    setShowNewBoardDialog(false);
  };

  const handleDragEndEvent = async (event: DragEndEvent) => {
    const result = handleDragEnd(event);
    if (result) {
      await updateBoard(result.boardId, { folderId: result.newFolderId });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Group boards by folder
  const { rootBoards: allRootBoards, folderBoards } = useMemo(
    () => groupBoardsByFolder(filteredBoards, folders),
    [filteredBoards, folders]
  );

  // Get root folders only
  const rootFolders = folders.filter(f => f.parentFolderId === null);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mes Projets</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredBoards.length} projet{filteredBoards.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
              <NewSyncStatus />
              <button
                onClick={() => setShowNewFolderDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FolderPlus className="w-5 h-5" />
                Nouveau Dossier
              </button>
              <button
                onClick={() => setShowNewBoardDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouveau Projet
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              />
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || selectedTags.length > 0
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filtres
              {selectedTags.length > 0 && (
                <span className="px-2 py-0.5 bg-primary-600 text-white rounded-full text-xs">
                  {selectedTags.length}
                </span>
              )}
            </button>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Vue grille"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Vue liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              <option value="updated">Modifié récemment</option>
              <option value="created">Créé récemment</option>
              <option value="name">Nom (A-Z)</option>
            </select>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filtrer par tags</h3>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Effacer tout
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-primary-300 dark:hover:border-primary-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {allTags.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun tag disponible</p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Boards List/Grid with Drag & Drop */}
      <main className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <DndContext onDragEnd={handleDragEndEvent}>
            {(filteredBoards.length > 0 || folders.length > 0) ? (
              viewMode === 'grid' ? (
                <div className="space-y-4">
                  {/* Folders */}
                  {rootFolders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      viewMode="grid"
                      onEdit={setEditingFolder}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {folderBoards.get(folder.id)?.map((board) => (
                          <BoardCard
                            key={board.id}
                            board={board}
                            viewMode="grid"
                            onEdit={setEditingBoard}
                          />
                        ))}
                      </div>
                    </FolderItem>
                  ))}

                  {/* Root Boards (not in any folder) */}
                  {allRootBoards.length > 0 && (
                    <RootBoardsZone viewMode="grid">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {allRootBoards.map((board) => (
                          <BoardCard
                            key={board.id}
                            board={board}
                            viewMode="grid"
                            onEdit={setEditingBoard}
                          />
                        ))}
                      </div>
                    </RootBoardsZone>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Folders */}
                  {rootFolders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      viewMode="list"
                      onEdit={setEditingFolder}
                    >
                      {folderBoards.get(folder.id)?.map((board) => (
                        <BoardCard
                          key={board.id}
                          board={board}
                          viewMode="list"
                          onEdit={setEditingBoard}
                        />
                      ))}
                    </FolderItem>
                  ))}

                  {/* Root Boards */}
                  <RootBoardsZone viewMode="list">
                    {allRootBoards.map((board) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        viewMode="list"
                        onEdit={setEditingBoard}
                      />
                    ))}
                  </RootBoardsZone>
                </div>
              )
            ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || selectedTags.length > 0
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Créez votre premier projet pour commencer'}
              </p>
              {!searchQuery && selectedTags.length === 0 && (
                <button
                  onClick={() => setShowNewBoardDialog(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nouveau Projet
                </button>
              )}
            </div>
          )}
          </DndContext>
        </div>
      </main>

      {/* New Board Dialog */}
      {showNewBoardDialog && (
        <BoardTypeSelector
          onSelect={handleCreateBoard}
          onClose={() => setShowNewBoardDialog(false)}
        />
      )}

      {/* Edit Board Modal */}
      {editingBoard && (
        <BoardEditModal
          board={editingBoard}
          isOpen={!!editingBoard}
          onClose={() => setEditingBoard(null)}
        />
      )}

      {/* Folder Modals */}
      <FolderEditModal
        folder={editingFolder}
        isOpen={showNewFolderDialog || !!editingFolder}
        onClose={() => {
          setShowNewFolderDialog(false);
          setEditingFolder(null);
        }}
      />
    </div>
  );
}
