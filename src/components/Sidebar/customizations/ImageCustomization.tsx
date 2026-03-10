/**
 * ImageCustomization Component
 * Customization options for Image elements
 */

import { useRef, useState } from 'react';
import { useElementStore } from '../../../store';
import type { ImageElement } from '../../../types';
import { Upload } from 'lucide-react';

interface ImageCustomizationProps {
  element: ImageElement;
}

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F3F4F6' },
  { name: 'Gray', value: '#E5E7EB' },
  { name: 'Dark Gray', value: '#D1D5DB' }
];

export default function ImageCustomization({ element }: ImageCustomizationProps) {
  const updateElement = useElementStore(state => state.updateElement);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Upload className="w-4 h-4" />
        {isUploading ? 'Uploading...' : element.content.src ? 'Change Image' : 'Upload Image'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

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
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
