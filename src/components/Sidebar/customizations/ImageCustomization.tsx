/**
 * ImageCustomization Component
 * Customization options for Image elements
 */

import { useRef, useState } from 'react';
import { useElementStore } from '../../../store';
import type { ImageElement } from '../../../types';
import {
  Upload,
  Palette,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface ImageCustomizationProps {
  element: ImageElement;
}

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F9FAFB' },
  { name: 'Gray', value: '#F3F4F6' },
  { name: 'Dark Gray', value: '#E5E7EB' }
];

export default function ImageCustomization({ element }: ImageCustomizationProps) {
  const { updateElement } = useElementStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorExpanded, setColorExpanded] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleColorChange = (color: string) => {
    updateElement(element.id, {
      style: {
        ...element.style,
        backgroundColor: color
      }
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
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

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Upload className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Image</span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : element.content.src ? 'Change Image' : 'Upload Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
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
