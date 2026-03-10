/**
 * AnchorPoints Component
 * Displays clickable anchor points on elements when Arrow tool is active
 */

import { useMemo } from 'react';
import type { Element, AnchorPosition, Position } from '../../types';
import { useUIStore, selectActiveTool } from '../../store';
import { useArrowConnectionStore, selectConnectionMode, selectSourceElementId } from '../../store/arrowConnectionStore';

interface AnchorPointsProps {
  element: Element;
  onAnchorClick: (elementId: string, anchor: AnchorPosition) => void;
}

// Get all anchor positions for an element
function getAnchorPositions(element: Element): Array<{ anchor: AnchorPosition; position: Position }> {
  const { position, size } = element;
  const { x, y } = position;
  const { width, height } = size;

  return [
    { anchor: 'top' as AnchorPosition, position: { x: x + width / 2, y } },
    { anchor: 'top-right' as AnchorPosition, position: { x: x + width, y } },
    { anchor: 'right' as AnchorPosition, position: { x: x + width, y: y + height / 2 } },
    { anchor: 'bottom-right' as AnchorPosition, position: { x: x + width, y: y + height } },
    { anchor: 'bottom' as AnchorPosition, position: { x: x + width / 2, y: y + height } },
    { anchor: 'bottom-left' as AnchorPosition, position: { x, y: y + height } },
    { anchor: 'left' as AnchorPosition, position: { x, y: y + height / 2 } },
    { anchor: 'top-left' as AnchorPosition, position: { x, y } }
  ];
}

export default function AnchorPoints({ element, onAnchorClick }: AnchorPointsProps) {
  const activeTool = useUIStore(selectActiveTool);
  const isConnecting = useArrowConnectionStore(selectConnectionMode);
  const startElementId = useArrowConnectionStore(selectSourceElementId);

  // Calculate anchor positions BEFORE any conditional returns (Rules of Hooks)
  const anchorPositions = useMemo(() => getAnchorPositions(element), [element]);
  const isStartElement = isConnecting && startElementId === element.id;

  // Only show anchor points when Arrow tool is active
  if (activeTool !== 'arrow') {
    return null;
  }

  // Don't show anchor points on arrows themselves
  if (element.type === 'arrow' || element.type === 'line') {
    return null;
  }

  return (
    <>
      {anchorPositions.map(({ anchor, position }) => (
        <div
          key={`${element.id}-${anchor}`}
          className="absolute pointer-events-auto"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10000
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAnchorClick(element.id, anchor);
          }}
        >
          <div
            className={`
              w-3 h-3 rounded-full border-2 cursor-pointer transition-all
              ${isStartElement && isConnecting
                ? 'bg-green-400 border-green-600 shadow-lg scale-125'
                : 'bg-blue-400 border-blue-600 hover:bg-blue-500 hover:scale-125'
              }
            `}
            title={`${anchor} anchor`}
          />
        </div>
      ))}
    </>
  );
}
