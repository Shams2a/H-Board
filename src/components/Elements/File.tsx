/**
 * File Component
 * File upload with preview, download, and size display
 */

import { useRef, useState } from 'react';
import type { FileElement } from '../../types';
import { useElementStore, useDragStore } from '../../store';
import { useDraggable } from '../../hooks/useDraggable';
import { useDarkModeColor } from '../../hooks/useDarkModeColor';
import {
  Upload,
  FileText,
  Download,
  File as FileIcon,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  X
} from 'lucide-react';

interface FileProps {
  element: FileElement;
  isSelected?: boolean;
  onSelect?: () => void;
  parentColumnId?: string;
}

// File type icon mapping
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType.startsWith('video/')) return FileVideo;
  if (fileType.startsWith('audio/')) return FileAudio;
  if (fileType.match(/zip|rar|7z|tar|gz/)) return FileArchive;
  if (fileType.match(/javascript|typescript|python|java|html|css|json|xml/)) return FileCode;
  if (fileType.match(/pdf|doc|docx|txt/)) return FileText;
  return FileIcon;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function File({ element, isSelected, onSelect: _onSelect, parentColumnId }: FileProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const draggedElementId = useDragStore(state => state.draggedElementId);
  const justFinishedDrag = useDragStore(state => state.justFinishedDrag);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isBeingDragged = draggedElementId === element.id;

  // Get dark mode adapted background color
  const backgroundColor = useDarkModeColor(element.style.backgroundColor || '#FFFFFF');

  const { handleMouseDown } = useDraggable({
    elementId: element.id,
    parentColumnId
  });

  const handleFileSelect = async (file: globalThis.File) => {
    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
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
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: base64
          }
        });
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
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

  const handleDownload = () => {
    if (!element.content.fileData) return;

    const link = document.createElement('a');
    link.href = element.content.fileData;
    link.download = element.content.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveFile = async () => {
    await updateElement(element.id, {
      content: {
        fileName: '',
        fileType: '',
        fileSize: 0,
        fileData: ''
      }
    });
  };

  const hasFile = element.content.fileName && element.content.fileName.length > 0;
  const IconComponent = hasFile ? getFileIcon(element.content.fileType) : FileIcon;

  return (
    <div
      ref={containerRef}
      data-element-id={element.id}
      className={`
        element-card ${(parentColumnId && !isBeingDragged) ? 'relative' : 'absolute'} cursor-move
        ${isSelected ? 'selected ring-2 ring-primary-500' : ''}
        ${element.locked ? 'cursor-not-allowed' : ''}
        ${!hasFile ? 'border-2 border-dashed border-gray-300 dark:border-gray-600' : ''}
        ${parentColumnId && !isBeingDragged && hasFile ? 'border border-gray-300 dark:border-gray-500 shadow-none' : ''}
      `}
      style={{
        ...((parentColumnId && !isBeingDragged) ? {} : {
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
        }),
        width: (parentColumnId && !isBeingDragged) ? '100%' : `${element.size.width}px`,
        minHeight: (parentColumnId && !isBeingDragged) ? 'auto' : `${element.size.height}px`,
        backgroundColor,
        zIndex: element.zIndex,
        pointerEvents: isBeingDragged ? 'none' : 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Don't change selection if we just finished dragging
        if (justFinishedDrag) {
          return;
        }
        const isMultiSelect = e.ctrlKey || e.metaKey;
        const { selectElement } = useElementStore.getState();
        selectElement(element.id, isMultiSelect);
      }}
      onMouseDown={handleMouseDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="p-4">
        {hasFile ? (
          <div className="space-y-3">
            {/* File Icon and Info */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-primary-600" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate mb-1">
                  {element.content.fileName}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(element.content.fileSize)}
                </p>
                {element.content.fileType && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {element.content.fileType}
                  </p>
                )}
              </div>

              {/* Remove button */}
              {isSelected && !element.locked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Image Preview (if image file) */}
            {element.content.fileType.startsWith('image/') && element.content.fileData && (
              <div className="mt-3">
                <img
                  src={element.content.fileData}
                  alt={element.content.fileName}
                  className="w-full h-auto rounded border border-gray-200 max-h-48 object-contain"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                Replace
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {isUploading ? 'Uploading...' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Max 10MB
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              PDF, DOC, Images, Videos, etc.
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
    </div>
  );
}
