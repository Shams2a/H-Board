/**
 * Image Component
 * Displays images with upload, resize, and lightbox capabilities
 */

import { useRef, useState } from 'react';
import type { ImageElement } from '../../types';
import { useElementStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import {
  Upload,
  Maximize2,
  X
} from 'lucide-react';

interface ImageProps {
  element: ImageElement;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function Image({ element, isSelected, onSelect }: ImageProps) {
  const { updateElement } = useElementStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { handleMouseDown } = useDraggable({
    elementId: element.id
  });

  const { handleMouseDown: handleResizeMouseDown } = useResizable({
    elementId: element.id,
    minWidth: 100,
    minHeight: 100,
    maxWidth: 1600,
    maxHeight: 1200
  });

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await updateElement(element.id, {
          content: {
            src: base64,
            alt: file.name,
            originalName: file.name
          }
        });
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const hasImage = element.content.src && element.content.src.length > 0;

  return (
    <>
      <div
        ref={containerRef}
        className={`
          element-card absolute overflow-hidden cursor-move
          ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
          ${element.locked ? 'cursor-not-allowed' : ''}
          ${!hasImage ? 'border-2 border-dashed border-gray-300' : ''}
        `}
        style={{
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
          width: `${element.size.width}px`,
          height: `${element.size.height}px`,
          backgroundColor: element.style.backgroundColor || '#F9FAFB',
          zIndex: element.zIndex
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        onMouseDown={handleMouseDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Toolbar (only when selected) */}
        {isSelected && (
          <div className="absolute top-0 left-0 right-0 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200 p-2 flex items-center gap-2 z-10">
            {/* Upload/Change Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2 py-1 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded transition-colors"
              disabled={isUploading}
            >
              <Upload className="w-3.5 h-3.5" />
              {hasImage ? 'Change' : 'Upload'}
            </button>

            {/* Lightbox Button (only if has image) */}
            {hasImage && (
              <button
                onClick={() => setShowLightbox(true)}
                className="flex items-center gap-1.5 px-2 py-1 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded transition-colors"
                title="View fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Image Content */}
        {hasImage ? (
          <img
            src={element.content.src}
            alt={element.content.alt || 'Image'}
            className="w-full h-full object-contain cursor-pointer"
            style={{ marginTop: isSelected ? '42px' : '0' }}
            onClick={(e) => {
              if (!isSelected) return;
              e.stopPropagation();
              setShowLightbox(true);
            }}
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? 'Uploading...' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Resize handle */}
        {isSelected && !element.locked && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-tl cursor-se-resize hover:bg-primary-600 transition-colors"
            onMouseDown={handleResizeMouseDown}
            title="Drag to resize"
          />
        )}
      </div>

      {/* Lightbox Modal */}
      {showLightbox && hasImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={element.content.src}
            alt={element.content.alt || 'Image'}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {element.content.originalName && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm rounded">
              {element.content.originalName}
            </div>
          )}
        </div>
      )}
    </>
  );
}
