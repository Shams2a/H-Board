/**
 * DatabaseBoard Component
 * Main component for Database board view (Notion-like table)
 */

import { useEffect, useRef } from 'react';
import { useDatabaseStore } from '../../store/databaseStore';
import DatabaseToolbar from './DatabaseToolbar';
import DatabaseTable from './DatabaseTable';
import { supabase } from '../../lib/supabase';

interface DatabaseBoardProps {
  boardId: string;
}

export default function DatabaseBoard({ boardId }: DatabaseBoardProps) {
  const { loadDatabase, properties, rows, views, createProperty, createView, currentViewId, getFilteredRows, getSortedRows } = useDatabaseStore();
  const initializedRef = useRef<Set<string>>(new Set());

  // Load database data on mount
  useEffect(() => {
    const loadData = async () => {
      // Wait for sync to complete (board creation in Supabase)
      // Longer delay for boards created from canvas
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadDatabase(boardId);
    };

    loadData();
  }, [boardId, loadDatabase]);

  // Initialize default view and Title property if needed
  useEffect(() => {
    const initializeDefaults = async () => {
      // Skip if already initialized for this board
      if (initializedRef.current.has(boardId)) {
        return;
      }

      const boardProperties = properties[boardId] || [];
      const boardViews = views[boardId] || [];

      // Only initialize if data has been loaded (not undefined)
      if (properties[boardId] === undefined || views[boardId] === undefined) {
        return;
      }

      // Helper function to wait until board exists in Supabase
      const waitForBoardInSupabase = async (maxAttempts = 10): Promise<boolean> => {
        if (!supabase) {
          console.warn('Supabase not configured, skipping board verification');
          return true; // Proceed in offline mode
        }

        for (let i = 0; i < maxAttempts; i++) {
          try {
            const { data, error } = await supabase
              .from('boards')
              .select('id')
              .eq('id', boardId)
              .maybeSingle(); // Use maybeSingle instead of single to avoid 406

            if (data && !error) {
              console.log(`✓ Board ${boardId} found in Supabase`);
              return true;
            }

            // Wait before next attempt
            if (i < maxAttempts - 1) {
              const delay = 500 * (i + 1); // 500ms, 1s, 1.5s, 2s, etc.
              console.log(`Waiting for board sync... attempt ${i + 1}/${maxAttempts} (${delay}ms)`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (error) {
            console.error('Error checking board existence:', error);
          }
        }

        console.error(`Board ${boardId} not found in Supabase after ${maxAttempts} attempts`);
        return false;
      };

      // Wait for board to be synced to Supabase
      const boardExists = await waitForBoardInSupabase();
      if (!boardExists && supabase) {
        console.error('Cannot initialize database board: board not synced to Supabase');
        return;
      }

      // Create default view if none exists
      if (boardViews.length === 0) {
        try {
          await createView(boardId, 'Table View', 'table');
        } catch (error) {
          console.error('Failed to create default view:', error);
        }
      }

      // Create Title property if none exists
      if (boardProperties.length === 0) {
        try {
          await createProperty(boardId, 'Title', 'title');
        } catch (error) {
          console.error('Failed to create Title property:', error);
        }
      }

      // Mark as initialized
      initializedRef.current.add(boardId);
    };

    initializeDefaults();
  }, [boardId, properties, views, createProperty, createView]);

  const boardProperties = properties[boardId] || [];
  const boardRows = rows[boardId] || [];
  const boardViews = views[boardId] || [];
  const activeViewId = currentViewId[boardId];
  const activeView = boardViews.find(v => v.id === activeViewId);

  // Apply filters and sorts to rows
  let displayRows = boardRows;
  if (activeView && activeViewId) {
    // Apply filters
    if (activeView.filters.length > 0) {
      displayRows = getFilteredRows(boardId, activeViewId);
    }
    // Apply sorts
    if (activeView.sorts.length > 0) {
      displayRows = getSortedRows(displayRows, activeView.sorts, boardProperties);
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <DatabaseToolbar boardId={boardId} />

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <DatabaseTable
          boardId={boardId}
          properties={boardProperties}
          rows={displayRows}
        />
      </div>

      {/* Empty state */}
      {boardProperties.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No properties yet</p>
            <p className="text-sm">Click "Add Property" to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
