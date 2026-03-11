/**
 * ActiveUsers Component
 * Displays avatars of users currently active on the board
 */

import { Users } from 'lucide-react';
import type { CollaborationUser } from '../../types/collaboration';

interface ActiveUsersProps {
  users: CollaborationUser[];
  maxVisible?: number;
  showCount?: boolean;
}

export default function ActiveUsers({
  users,
  maxVisible = 5,
  showCount = true,
}: ActiveUsersProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = Math.max(0, users.length - maxVisible);

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* User Avatars */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className="relative group"
            title={user.name}
          >
            {/* Avatar Circle */}
            <div
              className="w-8 h-8 rounded-full border-2 border-white dark:border-[#30363D] flex items-center justify-center text-white text-xs font-semibold shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: user.color }}
            >
              {getInitials(user.name)}
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {user.name}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>

            {/* Active indicator (green dot) */}
            {user.isActive && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#30363D] rounded-full"></div>
            )}
          </div>
        ))}

        {/* Remaining count */}
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-white dark:border-[#30363D] bg-gray-300 dark:bg-[#2C333A] flex items-center justify-center text-gray-700 dark:text-[#E0E6ED] text-xs font-semibold shadow-sm"
            title={`${remainingCount} more user${remainingCount > 1 ? 's' : ''}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* User count (optional) */}
      {showCount && (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-[#B1B9C4] bg-gray-100 dark:bg-[#252B32] px-2 py-1 rounded-full">
          <Users className="w-3 h-3" />
          <span>{users.length}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Get initials from a name (first 2 characters of first 2 words)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
