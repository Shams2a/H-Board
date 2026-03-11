/**
 * LinkCustomization Component
 * Customization options for Link elements
 */

import { useState } from 'react';
import { useElementStore } from '../../../store';
import type { LinkElement } from '../../../types';
import { ExternalLink } from 'lucide-react';

interface LinkCustomizationProps {
  element: LinkElement;
}

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F3F4F6' },
  { name: 'Blue', value: '#EFF6FF' },
  { name: 'Green', value: '#F0FDF4' }
];

export default function LinkCustomization({ element }: LinkCustomizationProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const [url, setUrl] = useState(element.content.url || '');
  const [title, setTitle] = useState(element.content.title || '');

  const handleSaveUrl = async () => {
    if (!url.trim()) {
      return;
    }

    let finalUrl = url.trim();
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = `https://${finalUrl}`;
    }

    let finalTitle = title.trim();
    if (!finalTitle) {
      try {
        const urlObj = new URL(finalUrl);
        finalTitle = urlObj.hostname.replace(/^www\./, '');
      } catch {
        finalTitle = finalUrl;
      }
    }

    const favicon = `https://www.google.com/s2/favicons?domain=${finalUrl}&sz=32`;

    await updateElement(element.id, {
      content: {
        url: finalUrl,
        title: finalTitle,
        description: element.content.description,
        favicon
      }
    });
  };

  const handleOpenLink = () => {
    if (element.content.url) {
      window.open(element.content.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-[#B1B9C4] mb-1">
          URL *
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleSaveUrl}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border-gray-300 dark:border-[#3D444D] rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED]"
        />
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-[#B1B9C4] mb-1">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveUrl}
          placeholder="Link title"
          className="w-full px-3 py-2 border border-gray-300 dark:border-[#3D444D] rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED]"
        />
      </div>

      {/* Open Link Button */}
      {element.content.url && (
        <button
          onClick={handleOpenLink}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Link
        </button>
      )}

      {/* Color Picker */}
      <div className="grid grid-cols-2 gap-2">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => handleColorChange(color.value)}
            className={`
              w-full aspect-square rounded border-2 transition-all
              ${(element.style.backgroundColor || '#FFFFFF') === color.value
                ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                : 'border-gray-300 dark:border-[#3D444D] hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
