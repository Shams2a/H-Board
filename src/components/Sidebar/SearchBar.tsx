/**
 * SearchBar Component
 * Global search for boards and elements
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, StickyNote, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore, selectBoards, useElementStore, selectElements } from '../../store';
import type { Board, Element } from '../../types';

interface SearchResult {
  type: 'board' | 'element';
  id: string;
  boardId?: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const boards = useBoardStore(selectBoards);
  const loadBoards = useBoardStore(state => state.loadBoards);
  const elements = useElementStore(selectElements);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // Perform search
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchQuery = query.toLowerCase();
    const foundResults: SearchResult[] = [];

    // Search in boards
    boards.forEach((board: Board) => {
      if (
        board.name.toLowerCase().includes(searchQuery) ||
        board.description?.toLowerCase().includes(searchQuery)
      ) {
        foundResults.push({
          type: 'board',
          id: board.id,
          title: board.name,
          subtitle: board.description,
          icon: <FolderOpen className="w-4 h-4" />
        });
      }
    });

    // Search in elements
    elements.forEach((element: Element) => {
      let matches = false;
      let title = '';
      let subtitle = '';

      switch (element.type) {
        case 'note':
          const textContent = element.content.text || '';
          matches = textContent.toLowerCase().includes(searchQuery);
          title = textContent.substring(0, 50) || 'Untitled Note';
          subtitle = `Note in ${boards.find(b => b.id === element.boardId)?.name || 'Unknown'}`;
          break;

        case 'column':
          matches = element.content.title?.toLowerCase().includes(searchQuery);
          title = element.content.title || 'Untitled Column';
          subtitle = `Column in ${boards.find(b => b.id === element.boardId)?.name || 'Unknown'}`;
          break;

        case 'todo':
          matches = element.content.items?.some(item =>
            item.text.toLowerCase().includes(searchQuery)
          );
          title = 'Todo List';
          subtitle = `${element.content.items?.length || 0} items in ${boards.find(b => b.id === element.boardId)?.name || 'Unknown'}`;
          break;

        case 'link':
          matches =
            !!(element.content.url?.toLowerCase().includes(searchQuery) ||
            element.content.title?.toLowerCase().includes(searchQuery));
          title = element.content.title || element.content.url || 'Untitled Link';
          subtitle = `Link in ${boards.find(b => b.id === element.boardId)?.name || 'Unknown'}`;
          break;

        case 'file':
          matches = element.content.fileName?.toLowerCase().includes(searchQuery);
          title = element.content.fileName || 'Untitled File';
          subtitle = `File in ${boards.find(b => b.id === element.boardId)?.name || 'Unknown'}`;
          break;

        case 'table':
          matches =
            element.content.headers?.some(h => h.toLowerCase().includes(searchQuery)) ||
            element.content.rows?.some(row =>
              row.some(cell => cell.value != null && String(cell.value).toLowerCase().includes(searchQuery))
            );
          title = 'Table';
          subtitle = `Table in ${boards.find(b => b.id === element.boardId)?.name || 'Unknown'}`;
          break;

        default:
          matches = false;
      }

      if (matches) {
        foundResults.push({
          type: 'element',
          id: element.id,
          boardId: element.boardId,
          title,
          subtitle,
          icon: getElementIcon(element.type)
        });
      }
    });

    setResults(foundResults.slice(0, 10)); // Limit to 10 results
    setIsOpen(foundResults.length > 0);
    setSelectedIndex(0);
  }, [query, boards, elements]);

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <StickyNote className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'board') {
      navigate(`/board/${result.id}`);
    } else if (result.type === 'element' && result.boardId) {
      navigate(`/board/${result.boardId}`);
      // TODO: Highlight and scroll to element
    }

    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search boards and elements..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className={`w-full px-3 py-2 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                index === selectedIndex ? 'bg-primary-50' : ''
              }`}
            >
              <div className="mt-1 text-gray-600">{result.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {result.title}
                </div>
                {result.subtitle && (
                  <div className="text-xs text-gray-500 truncate">
                    {result.subtitle}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 uppercase mt-1">
                {result.type}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && results.length === 0 && query.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-gray-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
