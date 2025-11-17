/**
 * Dashboard Component
 * Main view showing all boards with filters and search
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, SlidersHorizontal, X, Grid3x3, List } from 'lucide-react';
import { useBoardStore } from '../../store';
import BoardCard from './BoardCard';
import BoardEditModal from './BoardEditModal';
import type { Board } from '../../types';

type SortBy = 'name' | 'created' | 'updated';
type ViewMode = 'grid' | 'list';

export default function Dashboard() {
  const { boards, loadBoards, createBoard, getAllTags } = useBoardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewBoardDialog, setShowNewBoardDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

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
        const matchesTags = board.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesName && !matchesDescription && !matchesTags) return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some(tag => board.tags.includes(tag));
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

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    await createBoard(newBoardName.trim());
    setNewBoardName('');
    setShowNewBoardDialog(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Projets</h1>
              <p className="text-gray-600 mt-1">
                {filteredBoards.length} projet{filteredBoards.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowNewBoardDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau Projet
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || selectedTags.length > 0
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Vue grille"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="updated">Modifié récemment</option>
              <option value="created">Créé récemment</option>
              <option value="name">Nom (A-Z)</option>
            </select>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Filtrer par tags</h3>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-sm text-primary-600 hover:text-primary-700"
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
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {allTags.length === 0 && (
                  <p className="text-sm text-gray-500">Aucun tag disponible</p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Boards List/Grid */}
      <main className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {filteredBoards.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    viewMode="grid"
                    onEdit={setEditingBoard}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {filteredBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    viewMode="list"
                    onEdit={setEditingBoard}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedTags.length > 0
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Créez votre premier projet pour commencer'}
              </p>
              {!searchQuery && selectedTags.length === 0 && (
                <button
                  onClick={() => setShowNewBoardDialog(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nouveau Projet
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Board Dialog */}
      {showNewBoardDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Nouveau Projet
              </h2>
              <button
                onClick={() => setShowNewBoardDialog(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Nom du projet"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewBoardDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {editingBoard && (
        <BoardEditModal
          board={editingBoard}
          isOpen={!!editingBoard}
          onClose={() => setEditingBoard(null)}
        />
      )}
    </div>
  );
}
