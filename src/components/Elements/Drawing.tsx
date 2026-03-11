/**
 * Drawing Component
 * SVG-based freehand drawing renderer — no frame, no toolbar.
 * Paths are rendered as smooth SVG <path> elements positioned
 * absolutely based on the bounding box of all points.
 */

import React, { useRef, useMemo, useCallback, memo } from 'react';
import type { DrawingElement, DrawingPath, Position } from '../../types';
import { useElementStore, useDragStore, useUIStore, selectZoom, selectActiveTool } from '../../store';

interface DrawingProps {
  element: DrawingElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

const PADDING = 20;
const HANDLE_SIZE = 8;

/** Compute the axis-aligned bounding box across every point in every path. */
function computeBounds(paths: DrawingPath[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const path of paths) {
    for (const pt of path.points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  return { minX, minY, maxX, maxY };
}

/** Build an SVG path `d` string with quadratic bezier smoothing. */
function buildPathD(points: Position[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    // Single point — draw a tiny circle-like mark
    const p = points[0];
    return `M${p.x},${p.y} L${p.x},${p.y}`;
  }
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  }

  // Smooth curve: move to the first point, then for each pair of consecutive
  // points use the actual point as the control point and the midpoint between
  // it and the next point as the end point. This produces a smooth continuous
  // curve that passes close to every recorded point.
  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;

    if (i === 0) {
      // First segment — line to first midpoint
      d += ` L${midX},${midY}`;
    }

    if (i < points.length - 2) {
      const nextMidX = (next.x + points[i + 2].x) / 2;
      const nextMidY = (next.y + points[i + 2].y) / 2;
      d += ` Q${next.x},${next.y} ${nextMidX},${nextMidY}`;
    } else {
      // Last segment — line to end
      d += ` L${next.x},${next.y}`;
    }
  }

  return d;
}

const Drawing = memo(function Drawing({
  element,
  isSelected,
  onSelect: _onSelect,
  parentColumnId: _parentColumnId,
}: DrawingProps) {
  const updateElement = useElementStore((s) => s.updateElement);
  const draggedElementId = useDragStore((s) => s.draggedElementId);
  const justFinishedDrag = useDragStore((s) => s.justFinishedDrag);
  const zoom = useUIStore(selectZoom);
  const activeTool = useUIStore(selectActiveTool);
  const containerRef = useRef<HTMLDivElement>(null);

  const isBeingDragged = draggedElementId === element.id;
  const isDrawingMode = activeTool === 'drawing';
  const paths = element.content.paths;

  // --- Bounding box ----------------------------------------------------------

  const hasPaths = paths.length > 0 && paths.some((p) => p.points.length > 0);

  const bounds = useMemo(() => {
    if (!hasPaths) return null;
    return computeBounds(paths);
  }, [paths, hasPaths]);

  const boxX = bounds ? bounds.minX - PADDING : element.position.x;
  const boxY = bounds ? bounds.minY - PADDING : element.position.y;
  const boxW = bounds
    ? bounds.maxX - bounds.minX + PADDING * 2
    : element.size.width;
  const boxH = bounds
    ? bounds.maxY - bounds.minY + PADDING * 2
    : element.size.height;

  // --- Memoised SVG `d` strings ---------------------------------------------

  const pathDStrings = useMemo(() => {
    return paths.map((p) => {
      // Translate points into local SVG coordinates
      const translated = p.points.map((pt) => ({
        x: pt.x - boxX,
        y: pt.y - boxY,
      }));
      return buildPathD(translated);
    });
  }, [paths, boxX, boxY]);

  // --- Click to select -------------------------------------------------------

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (justFinishedDrag) return;
      const isMulti = e.ctrlKey || e.metaKey;
      const { selectElement } = useElementStore.getState();
      selectElement(element.id, isMulti);
    },
    [element.id, justFinishedDrag],
  );

  // --- Drag handling (Line.tsx pattern) --------------------------------------

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (element.locked) return;
      if (e.button !== 0) return;
      if (!isSelected) return; // first click selects; drag only when already selected

      e.preventDefault();

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      // Snapshot every path's points at drag start
      const initialPaths = paths.map((p) => ({
        ...p,
        points: p.points.map((pt) => ({ ...pt })),
      }));
      let hasMoved = false;

      const onMove = (me: MouseEvent) => {
        me.preventDefault();
        const dx = (me.clientX - startClientX) / zoom;
        const dy = (me.clientY - startClientY) / zoom;

        if (!hasMoved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;

        if (!hasMoved) {
          hasMoved = true;
          useDragStore.getState().setDraggedElement(element.id, null);
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        }

        const movedPaths: DrawingPath[] = initialPaths.map((p) => ({
          ...p,
          points: p.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
        }));

        updateElement(element.id, { content: { paths: movedPaths } });
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (hasMoved) {
          useDragStore.getState().setJustFinishedDrag(true);
          setTimeout(
            () => useDragStore.getState().setJustFinishedDrag(false),
            100,
          );
        }
        useDragStore.getState().clearDrag();
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [element.id, element.locked, isSelected, paths, zoom, updateElement],
  );

  // --- Render ----------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      data-element-id={element.id}
      className="absolute"
      style={{
        left: `${boxX}px`,
        top: `${boxY}px`,
        width: `${boxW}px`,
        height: `${boxH}px`,
        zIndex: element.zIndex,
        pointerEvents: isBeingDragged || isDrawingMode ? 'none' : 'auto',
        cursor: element.locked
          ? 'not-allowed'
          : isSelected
            ? 'grab'
            : 'default',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Selection outline — hidden while actively drawing */}
      {isSelected && !isDrawingMode && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px dashed #3B82F6',
            borderRadius: 4,
          }}
        />
      )}

      {/* SVG paths */}
      <svg
        width={boxW}
        height={boxH}
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        {paths.map((path, i) => {
          const d = pathDStrings[i];
          if (!d) return null;

          const isEraser = path.tool === 'eraser';

          return (
            <React.Fragment key={i}>
              {/* Visible stroke */}
              <path
                d={d}
                fill="none"
                stroke={isEraser ? 'white' : path.color}
                strokeWidth={path.thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={isEraser ? { mixBlendMode: 'normal' } : undefined}
                pointerEvents="none"
              />
              {/* Invisible wider hit area for clicking near paths */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(path.thickness, 12)}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="stroke"
              />
            </React.Fragment>
          );
        })}
      </svg>

      {/* Resize handles when selected — hidden while actively drawing */}
      {isSelected && !element.locked && !isDrawingMode && (
        <>
          {/* Corner handles */}
          {[
            { x: 0, y: 0, cursor: 'nw-resize' },
            { x: boxW, y: 0, cursor: 'ne-resize' },
            { x: 0, y: boxH, cursor: 'sw-resize' },
            { x: boxW, y: boxH, cursor: 'se-resize' },
          ].map((handle, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: handle.x - HANDLE_SIZE / 2,
                top: handle.y - HANDLE_SIZE / 2,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                backgroundColor: 'white',
                border: '2px solid #3B82F6',
                borderRadius: 2,
                cursor: handle.cursor,
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ))}
        </>
      )}
    </div>
  );
});

export default Drawing;
