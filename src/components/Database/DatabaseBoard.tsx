/**
 * DatabaseBoard Component
 * Main component for Database board view (Notion-like table)
 */

import { useEffect, useRef, useState } from 'react';
import { useDatabaseStore } from '../../store/databaseStore';
import DatabaseToolbar from './DatabaseToolbar';
import DatabaseTable from './DatabaseTable';
import { supabase } from '../../lib/supabase';

interface DatabaseBoardProps {
  boardId: string;
}

// Empty arrays with stable references to avoid re-renders
const EMPTY_ARRAY: any[] = [];

export default function DatabaseBoard({ boardId }: DatabaseBoardProps) {
  // Use selectors to ensure reactivity when nested state changes
  // Return EMPTY_ARRAY reference instead of creating new arrays
  const boardProperties = useDatabaseStore((state) => state.properties[boardId] ?? EMPTY_ARRAY);
  const boardRows = useDatabaseStore((state) => state.rows[boardId] ?? EMPTY_ARRAY);
  const boardViews = useDatabaseStore((state) => state.views[boardId] ?? EMPTY_ARRAY);
  const activeViewId = useDatabaseStore((state) => state.currentViewId[boardId]);
  const loadDatabase = useDatabaseStore(state => state.loadDatabase);
  const getFilteredRows = useDatabaseStore(state => state.getFilteredRows);
  const getSortedRows = useDatabaseStore(state => state.getSortedRows);
  const initializedRef = useRef<Set<string>>(new Set());
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load database data on mount
  useEffect(() => {
    const loadData = async () => {
      // Wait for sync to complete (board creation in Supabase)
      // Longer delay for boards created from canvas
      await new Promise(resolve => setTimeout(resolve, 3000));
      await loadDatabase(boardId);
      setDataLoaded(true);
    };

    loadData();
  }, [boardId, loadDatabase]);

  // Initialize default view and Title property if needed
  useEffect(() => {
    // Only run once after data is loaded
    if (!dataLoaded || initializedRef.current.has(boardId)) {
      return;
    }

    const initializeDefaults = async () => {
      console.log('Starting initialization for board:', boardId);

      // Mark as initializing to prevent re-entry
      initializedRef.current.add(boardId);

      // Helper function to wait until board exists in Supabase
      const waitForBoardInSupabase = async (maxAttempts = 20): Promise<boolean> => {
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

            // Wait before next attempt (longer delays for later attempts)
            if (i < maxAttempts - 1) {
              const delay = Math.min(300 * (i + 1), 3000); // 300ms, 600ms, 900ms... max 3s
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

      // Get current state from store
      const { views, properties, createView, createProperty } = useDatabaseStore.getState();
      const currentViews = views[boardId] || [];
      const currentProperties = properties[boardId] || [];

      // Create default view if none exists
      if (currentViews.length === 0) {
        try {
          console.log('Creating default view...');
          await createView(boardId, 'Table View', 'table');
        } catch (error) {
          console.error('Failed to create default view:', error);
        }
      }

      // Create Title property if none exists
      if (currentProperties.length === 0) {
        try {
          console.log('Creating Title property...');
          await createProperty(boardId, 'Title', 'title');
        } catch (error) {
          console.error('Failed to create Title property:', error);
        }
      }

      console.log('Initialization complete for board:', boardId);
    };

    initializeDefaults();
    // Only depend on dataLoaded and boardId to avoid loops
  }, [boardId, dataLoaded]);

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

  // Show loading state while data is being loaded
  if (!dataLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-[#1E252B]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-[#B1B9C4]">Loading database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1E252B]">
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
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-[#B1B9C4]">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No properties yet</p>
            <p className="text-sm">Click "Add Property" to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
