/**
 * DatabaseTable Component
 * Displays database rows and columns in a table view using @tanstack/react-table
 */

import { useMemo, useRef, useState } from 'react';
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

export default function DatabaseTable({ boardId, properties, rows }: DatabaseTableProps) {
  const updateRow = useDatabaseStore(state => state.updateRow);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Require 3px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle column reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('Drag ended:', { active: active.id, over: over?.id });

    if (over && active.id !== over.id) {
      const oldIndex = properties.findIndex((p) => p.id === active.id);
      const newIndex = properties.findIndex((p) => p.id === over.id);

      console.log('Reordering columns:', { oldIndex, newIndex });

      const reordered = arrayMove(properties, oldIndex, newIndex);
      const propertyIds = reordered.map((p) => p.id);

      // Update order in store
      useDatabaseStore.getState().reorderProperties(boardId, propertyIds);
    }
  };

  // Build columns from properties
  const columns = useMemo<ColumnDef<DatabaseRow>[]>(() => {
    const cols: ColumnDef<DatabaseRow>[] = properties.map((property) => ({
      id: property.id,
      accessorFn: (row) => row.properties[property.id],
      header: () => <PropertyHeader property={property} boardId={boardId} />,
      cell: ({ row }) => (
        <DatabaseCell
          row={row.original}
          property={property}
          value={row.original.properties[property.id]}
          onUpdate={(value) => updateRow(row.original.id, property.id, value)}
        />
      ),
      size: property.width || 200,
      minSize: 100,
      maxSize: 600
    }));

    return cols;
  }, [properties, boardId, updateRow]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);

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
          <table className="min-w-full border-collapse" style={{ width: 'max-content' }}>
            {/* Table Header */}
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#101418]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <SortableHeaderCell key={header.id} header={header}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </SortableHeaderCell>
                  ))}
                  {/* Actions column */}
                  <th className="sticky right-0 bg-gray-50 dark:bg-[#101418] border-b border-gray-200 dark:border-[#30363D] w-12 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.3)]" />
                </tr>
              ))}
            </thead>

        {/* Table Body (virtualized) */}
        <tbody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = tableRows[virtualRow.index];
            return (
              <tr
                key={row.id}
                data-index={virtualRow.index}
                ref={(node) => rowVirtualizer.measureElement(node)}
                className="group hover:bg-gray-50 dark:hover:bg-[#252B32]/50 transition-colors"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-r border-b border-gray-200 dark:border-[#30363D] px-3 py-2"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}

                {/* Actions column */}
                <td className="sticky right-0 bg-white dark:bg-[#1E252B] group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 border-b border-gray-200 dark:border-[#30363D] px-2 py-2">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuRowId(openMenuRowId === row.original.id ? null : row.original.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all p-1 rounded hover:bg-gray-100 dark:hover:bg-[#252B32]"
                      title="Row actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuRowId === row.original.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenuRowId(null)}
                        />
                        <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-[#1E252B] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg z-50 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              useDatabaseStore.getState().duplicateRow(row.original.id);
                              setOpenMenuRowId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#252B32] flex items-center gap-2 text-gray-700 dark:text-[#B1B9C4]"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              useDatabaseStore.getState().deleteRow(row.original.id);
                              setOpenMenuRowId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
          </table>
        </SortableContext>

        {/* Empty rows state */}
        {rows.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-[#B1B9C4]">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No rows yet</p>
              <p className="text-sm">Click "New Row" to add your first entry</p>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
