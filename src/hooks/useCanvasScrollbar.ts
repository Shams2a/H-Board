/**
 * useCanvasScrollbar Hook
 * Manages scrollbar computation, dragging, and track click logic for the Canvas.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';

const CANVAS_VIRTUAL_WIDTH = 10000;
const CANVAS_VIRTUAL_HEIGHT = 10000;

interface UseCanvasScrollbarParams {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panX: number;
  panY: number;
  setPan: (x: number, y: number) => void;
  setIsInteracting: (value: boolean) => void;
}

export function useCanvasScrollbar({
  canvasRef,
  zoom,
  panX,
  panY,
  setPan,
  setIsInteracting,
}: UseCanvasScrollbarParams) {
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState<'horizontal' | 'vertical' | null>(null);
  const [scrollbarDragStart, setScrollbarDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  // Calculate scrollbar dimensions
  const scrollbarInfo = useMemo(() => {
    const containerWidth = canvasRef.current?.clientWidth || 800;
    const containerHeight = canvasRef.current?.clientHeight || 600;

    const visibleWidth = containerWidth / zoom;
    const visibleHeight = containerHeight / zoom;

    const hThumbWidth = Math.max(30, (visibleWidth / CANVAS_VIRTUAL_WIDTH) * containerWidth);
    const vThumbHeight = Math.max(30, (visibleHeight / CANVAS_VIRTUAL_HEIGHT) * containerHeight);

    const maxPanX = CANVAS_VIRTUAL_WIDTH - visibleWidth;
    const maxPanY = CANVAS_VIRTUAL_HEIGHT - visibleHeight;

    const hThumbPosition = maxPanX > 0 ? ((-panX) / maxPanX) * (containerWidth - hThumbWidth) : 0;
    const vThumbPosition = maxPanY > 0 ? ((-panY) / maxPanY) * (containerHeight - vThumbHeight) : 0;

    return {
      containerWidth,
      containerHeight,
      hThumbWidth,
      vThumbHeight,
      hThumbPosition: Math.max(0, Math.min(hThumbPosition, containerWidth - hThumbWidth)),
      vThumbPosition: Math.max(0, Math.min(vThumbPosition, containerHeight - vThumbHeight)),
      maxPanX,
      maxPanY,
    };
  }, [zoom, panX, panY]);

  // Handle scrollbar mouse down
  const handleScrollbarMouseDown = useCallback(
    (type: 'horizontal' | 'vertical') => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDraggingScrollbar(type);
      setIsInteracting(true);
      setScrollbarDragStart({
        x: e.clientX,
        y: e.clientY,
        panX,
        panY,
      });
    },
    [panX, panY, setIsInteracting]
  );

  // Handle scrollbar dragging via document-level listeners
  useEffect(() => {
    if (!isDraggingScrollbar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { containerWidth, containerHeight, hThumbWidth, vThumbHeight, maxPanX, maxPanY } = scrollbarInfo;

      if (isDraggingScrollbar === 'horizontal') {
        const deltaX = e.clientX - scrollbarDragStart.x;
        const trackWidth = containerWidth - hThumbWidth;
        const panDelta = trackWidth > 0 ? (deltaX / trackWidth) * maxPanX : 0;
        const newPanX = Math.max(-maxPanX, Math.min(0, scrollbarDragStart.panX - panDelta));
        setPan(newPanX, panY);
      } else {
        const deltaY = e.clientY - scrollbarDragStart.y;
        const trackHeight = containerHeight - vThumbHeight;
        const panDelta = trackHeight > 0 ? (deltaY / trackHeight) * maxPanY : 0;
        const newPanY = Math.max(-maxPanY, Math.min(0, scrollbarDragStart.panY - panDelta));
        setPan(panX, newPanY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingScrollbar(null);
      setIsInteracting(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingScrollbar, scrollbarDragStart, scrollbarInfo, panX, panY, setPan, setIsInteracting]);

  // Handle scrollbar track click
  const handleScrollbarTrackClick = useCallback(
    (type: 'horizontal' | 'vertical') => (e: React.MouseEvent) => {
      e.stopPropagation();
      const { containerWidth, containerHeight, hThumbWidth, vThumbHeight, maxPanX, maxPanY } = scrollbarInfo;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      if (type === 'horizontal') {
        const clickX = e.clientX - rect.left;
        const trackWidth = containerWidth - hThumbWidth;
        const ratio = trackWidth > 0 ? clickX / containerWidth : 0;
        const newPanX = -ratio * maxPanX;
        setPan(Math.max(-maxPanX, Math.min(0, newPanX)), panY);
      } else {
        const clickY = e.clientY - rect.top;
        const trackHeight = containerHeight - vThumbHeight;
        const ratio = trackHeight > 0 ? clickY / containerHeight : 0;
        const newPanY = -ratio * maxPanY;
        setPan(panX, Math.max(-maxPanY, Math.min(0, newPanY)));
      }
    },
    [scrollbarInfo, panX, panY, setPan]
  );

  return {
    scrollbarInfo,
    handleScrollbarMouseDown,
    handleScrollbarTrackClick,
  };
}
