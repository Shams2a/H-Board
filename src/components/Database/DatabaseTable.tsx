/**
 * DatabaseTable Component
 * Displays database rows and columns in a table view using @tanstack/react-table
 */

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useReactTable,
  getCoreRowModel,
  flexRender
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { DatabaseProperty, DatabaseRow } from '../../types';
import { useDatabaseStore } from '../../store/databaseStore';
import { MoreVertical, Copy, Trash2 } from 'lucide-react';
import DatabaseCell from './DatabaseCell';
import PropertyHeader from './PropertyHeader';
import SortableHeaderCell from './SortableHeaderCell';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';

interface DatabaseTableProps {
  boardId: string;
  properties: DatabaseProperty[];
  rows: DatabaseRow[];
}

const ACTION_COL_WIDTH = 48;

export default function DatabaseTable({ boardId, properties, rows }: DatabaseTableProps) {
  const updateRow = useDatabaseStore(state => state.updateRow);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle column reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = properties.findIndex((p) => p.id === active.id);
      const newIndex = properties.findIndex((p) => p.id === over.id);

      const reordered = arrayMove(properties, oldIndex, newIndex);
      const propertyIds = reordered.map((p) => p.id);

      useDatabaseStore.getState().reorderProperties(boardId, propertyIds);
    }
  };

  // Position the menu relative to the button
  const handleOpenMenu = useCallback((rowId: string, buttonEl: HTMLButtonElement) => {
    if (openMenuRowId === rowId) {
      setOpenMenuRowId(null);
      setMenuPosition(null);
      return;
    }
    const rect = buttonEl.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.right - 160, // 160 = menu width (w-40)
    });
    setOpenMenuRowId(rowId);
    menuButtonRef.current = buttonEl;
  }, [openMenuRowId]);

  // Close menu on scroll
  const tableContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openMenuRowId) return;
    const container = tableContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setOpenMenuRowId(null);
      setMenuPosition(null);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [openMenuRowId]);

  // Build columns from properties
  const columns = useMemo<ColumnDef<DatabaseRow>[]>(() => {
    return properties.map((property) => ({
      id: property.id,
      accessorFn: (row: DatabaseRow) => row.properties[property.id],
      header: () => <PropertyHeader property={property} boardId={boardId} />,
      cell: ({ row }: { row: any }) => (
        <DatabaseCell
          row={row.original}
          property={property}
          value={row.original.properties[property.id]}
          onUpdate={(value: any) => updateRow(row.original.id, property.id, value)}
        />
      ),
      size: property.width || 200,
      minSize: 100,
      maxSize: 600
    }));
  }, [properties, boardId, updateRow]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true
  });

  const tableRows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  if (properties.length === 0) {
    return null;
  }

  // Calculate total width for rows to match header
  const headerGroups = table.getHeaderGroups();
  const totalWidth = headerGroups[0]?.headers.reduce((sum, h) => sum + h.getSize(), 0) ?? 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={tableContainerRef}
        className="relative w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#3D444D] scrollbar-track-transparent"
      >
        <SortableContext
          items={properties.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div style={{ width: totalWidth + ACTION_COL_WIDTH, minWidth: '100%' }}>
            {/* Table Header */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-[#101418] flex">
              {headerGroups[0]?.headers.map((header) => (
                <SortableHeaderCell key={header.id} header={header}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </SortableHeaderCell>
              ))}
              {/* Actions column header */}
              <div
                className="sticky right-0 bg-gray-50 dark:bg-[#101418] border-b border-gray-200 dark:border-[#30363D] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.3)]"
                style={{ width: ACTION_COL_WIDTH, flexShrink: 0 }}
              />
            </div>

            {/* Table Body (virtualized) */}
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = tableRows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    className="group hover:bg-gray-50 dark:hover:bg-[#252B32]/50 transition-colors flex"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        className="border-r border-b border-gray-200 dark:border-[#30363D] px-3 py-2"
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                          maxWidth: cell.column.getSize(),
                          flexShrink: 0,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}

                    {/* Actions column */}
                    <div
                      className="sticky right-0 bg-white dark:bg-[#1E252B] group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 border-b border-gray-200 dark:border-[#30363D] px-2 py-2 flex items-center justify-center"
                      style={{ width: ACTION_COL_WIDTH, flexShrink: 0 }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMenu(row.original.id, e.currentTarget);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all p-1 rounded hover:bg-gray-100 dark:hover:bg-[#252B32]"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SortableContext>

        {/* Empty rows state */}
        {rows.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-[#B1B9C4]">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Aucune ligne</p>
              <p className="text-sm">Cliquez sur "Nouvelle ligne" pour ajouter une entree</p>
            </div>
          </div>
        )}
      </div>

      {/* Row context menu - rendered via portal */}
      {openMenuRowId && menuPosition && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => {
              setOpenMenuRowId(null);
              setMenuPosition(null);
            }}
          />
          <div
            className="fixed w-40 bg-white dark:bg-[#1E252B] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg z-[9999] py-1"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                useDatabaseStore.getState().duplicateRow(openMenuRowId);
                setOpenMenuRowId(null);
                setMenuPosition(null);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#252B32] flex items-center gap-2 text-gray-700 dark:text-[#B1B9C4]"
            >
              <Copy className="w-4 h-4" />
              Dupliquer
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                useDatabaseStore.getState().deleteRow(openMenuRowId);
                setOpenMenuRowId(null);
                setMenuPosition(null);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </>,
        document.body
      )}
    </DndContext>
  );
}
