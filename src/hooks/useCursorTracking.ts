/**
 * Hook to track and broadcast cursor position
 */

import { useEffect } from 'react';
import { getCollaborationService } from '../services/collaboration/collaborationService';

interface UseCursorTrackingOptions {
  enabled?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}

export function useCursorTracking({
  enabled = true,
  containerRef,
}: UseCursorTrackingOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    const service = getCollaborationService();

    const handleMouseMove = (e: MouseEvent) => {
      // If a container ref is provided, calculate position relative to it
      // Otherwise use viewport coordinates
      let x = e.clientX;
      let y = e.clientY;

      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        x = e.clientX - rect.left + containerRef.current.scrollLeft;
        y = e.clientY - rect.top + containerRef.current.scrollTop;
      }

      service.updateCursor(x, y);
    };

    // Attach to window or container
    const target = containerRef?.current || window;
    target.addEventListener('mousemove', handleMouseMove as any);

    return () => {
      target.removeEventListener('mousemove', handleMouseMove as any);
    };
  }, [enabled, containerRef]);
}
