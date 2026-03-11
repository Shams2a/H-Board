/**
 * useCanvasWheel Hook
 * Manages mouse wheel interactions for the Canvas:
 *   - Two-finger scroll → pan
 *   - Shift + scroll → horizontal pan
 *   - Ctrl/Cmd + scroll (or trackpad pinch) → zoom centered on cursor
 */

import { useEffect } from 'react';
import { useUIStore } from '../store';

interface UseCanvasWheelParams {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  panX: number;
  panY: number;
  setPan: (x: number, y: number) => void;
  setIsInteracting: (value: boolean) => void;
  currentBoardId: string | null;
}

export function useCanvasWheel({
  canvasRef,
  panX,
  panY,
  setPan,
  setIsInteracting,
  currentBoardId,
}: UseCanvasWheelParams) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let wheelTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setIsInteracting(true);

      // Ctrl/Cmd + scroll OR trackpad pinch (fires as ctrlKey + wheel)
      if (e.ctrlKey || e.metaKey) {
        const { zoom, zoomAtPoint } = useUIStore.getState();

        // deltaY is negative when zooming in (pinch out / scroll up)
        const zoomSensitivity = 0.01;
        const newZoom = zoom * (1 - e.deltaY * zoomSensitivity);

        zoomAtPoint(newZoom, e.clientX, e.clientY);
      } else {
        // Regular scroll → pan
        const deltaX = e.deltaX || (e.shiftKey ? e.deltaY : 0);
        const deltaY = e.shiftKey ? 0 : e.deltaY;

        setPan(panX - deltaX, panY - deltaY);
      }

      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        setIsInteracting(false);
      }, 150);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [panX, panY, setPan, currentBoardId, canvasRef, setIsInteracting]);
}
