/**
 * Remote Cursors Component
 * Displays cursors of other users in real-time
 */

import { useEffect, useState } from 'react';
import { getCollaborationService } from '../../services/collaboration/collaborationService';
import type { CursorPosition } from '../../types/collaboration';

export default function RemoteCursors() {
  const [cursors, setCursors] = useState<CursorPosition[]>([]);

  useEffect(() => {
    const service = getCollaborationService();

    // Subscribe to cursor updates
    service.subscribeToCursors((newCursors) => {
      setCursors(newCursors);
    });

    return () => {
      // No explicit unsubscribe needed, handled by service cleanup
    };
  }, []);

  return (
    <>
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="pointer-events-none fixed z-[9999] transition-transform duration-100"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            <path
              d="M5.65376 12.3673L8.30727 19.6074C8.71246 20.7984 10.2744 20.8408 10.7408 19.6746L13.2081 13.6858C13.3503 13.3238 13.6745 13.0604 14.0638 12.9954L20.2951 11.8785C21.5302 11.6662 21.6823 9.98938 20.4877 9.55014L5.59562 3.79693C4.52019 3.39681 3.37745 4.42967 3.65641 5.55137L5.65376 12.3673Z"
              fill={cursor.userColor}
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* User name label */}
          <div
            className="absolute top-5 left-4 px-2 py-1 rounded text-xs font-semibold text-white whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: cursor.userColor,
            }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </>
  );
}
