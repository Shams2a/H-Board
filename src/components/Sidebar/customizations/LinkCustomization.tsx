/**
 * LinkCustomization Component
 * Customization options for Link elements
 */

import { useState } from 'react';
import { useElementStore } from '../../../store';
import type { LinkElement } from '../../../types';
import {
  Link as LinkIcon,
  Palette,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface LinkCustomizationProps {
  element: LinkElement;
}

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F9FAFB' },
  { name: 'Blue', value: '#EFF6FF' },
  { name: 'Green', value: '#F0FDF4' }
];

export default function LinkCustomization({ element }: LinkCustomizationProps) {
  const { updateElement } = useElementStore();
  const [colorExpanded, setColorExpanded] = useState(true);
  const [urlExpanded, setUrlExpanded] = useState(false);
  const [url, setUrl] = useState(element.content.url || '');
  const [title, setTitle] = useState(element.content.title || '');

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color
      }
    });
  };

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

  return (
    <div className="space-y-4">
      {/* URL Section */}
      <div>
        <button
          onClick={() => setUrlExpanded(!urlExpanded)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
        >
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">URL</span>
          </div>
          {urlExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {urlExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleSaveUrl}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                onBlur={handleSaveUrl}
                placeholder="Link title"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {element.content.url && (
              <button
                onClick={handleOpenLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Link
              </button>
            )}
          </div>
        )}
      </div>

      {/* Background Color Section */}
      <div>
        <button
          onClick={() => setColorExpanded(!colorExpanded)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Background Color</span>
          </div>
          {colorExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {colorExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <div className="grid grid-cols-2 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`
                    w-full aspect-square rounded border-2 transition-all
                    ${element.style.backgroundColor === color.value
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
