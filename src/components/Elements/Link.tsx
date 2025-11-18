/**
 * Link Component
 * Web link card with URL, title, description and favicon
 */

import { useRef, useState } from 'react';
import type { LinkElement } from '../../types';
import { useElementStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import {
  ExternalLink,
  Link as LinkIcon,
  Check,
  X
} from 'lucide-react';

interface LinkProps {
  element: LinkElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

export default function Link({ element, isSelected, onSelect, parentColumnId }: LinkProps) {
  const { updateElement } = useElementStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditingUrl, setIsEditingUrl] = useState(!element.content.url);
  const [url, setUrl] = useState(element.content.url || '');
  const [title, setTitle] = useState(element.content.title || '');

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const handleSaveUrl = async () => {
    if (!url.trim()) {
      return;
    }

    // Add https:// if not present
    let finalUrl = url.trim();
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = `https://${finalUrl}`;
    }

    // Extract domain for title if title is empty
    let finalTitle = title.trim();
    if (!finalTitle) {
      try {
        const urlObj = new URL(finalUrl);
        finalTitle = urlObj.hostname.replace(/^www\./, '');
      } catch {
        finalTitle = finalUrl;
      }
    }

    // Generate favicon URL
    const favicon = `https://www.google.com/s2/favicons?domain=${finalUrl}&sz=32`;

    await updateElement(element.id, {
      content: {
        url: finalUrl,
        title: finalTitle,
        description: element.content.description,
        favicon
      }
    });

    setIsEditingUrl(false);
  };

  const handleCancelEdit = () => {
    setUrl(element.content.url || '');
    setTitle(element.content.title || '');
    setIsEditingUrl(false);
  };

  const handleOpenLink = () => {
    if (element.content.url) {
      window.open(element.content.url, '_blank', 'noopener,noreferrer');
    }
  };

  const hasValidUrl = element.content.url && element.content.url.length > 0;

  return (
    <div
      ref={containerRef}
      className={`
        element-card absolute cursor-move
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : ''}
        ${!hasValidUrl ? 'border-2 border-dashed border-gray-300' : ''}
      `}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        minHeight: `${element.size.height}px`,
        backgroundColor: element.style.backgroundColor || '#FFFFFF',
        zIndex: element.zIndex
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onMouseDown={handleMouseDown}
    >

      {/* Content */}
      <div className="p-4">
        {isEditingUrl ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveUrl();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Link title"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveUrl();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveUrl}
                disabled={!url.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : hasValidUrl ? (
          <div
            className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
            onClick={handleOpenLink}
          >
            {/* Favicon */}
            {element.content.favicon ? (
              <img
                src={element.content.favicon}
                alt=""
                className="w-6 h-6 flex-shrink-0 mt-0.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <LinkIcon className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                {element.content.title || 'Untitled Link'}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {element.content.url}
              </p>
              {element.content.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {element.content.description}
                </p>
              )}
            </div>

            {/* External link icon */}
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 cursor-pointer"
            onClick={() => setIsEditingUrl(true)}
          >
            <LinkIcon className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">Add a link</p>
            <p className="text-xs text-gray-500 mt-1">
              Click to enter a URL
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
