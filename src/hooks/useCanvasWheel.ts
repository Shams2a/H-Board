/**
 * useCanvasWheel Hook
 * Manages mouse wheel panning logic for the Canvas.
 */

import { useEffect } from 'react';

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

      const panSpeed = 1;

      const deltaX = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const deltaY = e.shiftKey ? 0 : e.deltaY;

      const newPanX = panX - deltaX * panSpeed;
      const newPanY = panY - deltaY * panSpeed;

      setPan(newPanX, newPanY);

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
