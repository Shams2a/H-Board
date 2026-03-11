/**
 * KeyboardShortcutsModal Component
 * Displays all available keyboard shortcuts in a modal
 */

import { useState } from 'react';
import { X, Search, Keyboard } from 'lucide-react';
import { keyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter shortcuts based on search query
  const filteredShortcuts = keyboardShortcuts.map(category => ({
    ...category,
    shortcuts: category.shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.some(key => key.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.shortcuts.length > 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1E252B] rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#30363D] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E0E6ED]">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#252B32] rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-[#B1B9C4]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#30363D]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#3D444D] bg-white dark:bg-[#252B32] text-gray-900 dark:text-[#E0E6ED] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12">
              <Keyboard className="w-16 h-16 text-gray-300 dark:text-[#6B7280] mx-auto mb-4" />
              <p className="text-gray-500 dark:text-[#B1B9C4]">No shortcuts found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredShortcuts.map((category) => (
                <div key={category.category}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-[#B1B9C4] uppercase tracking-wider mb-3">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-[#252B32] rounded-lg transition-colors"
                      >
                        <span className="text-gray-700 dark:text-[#E0E6ED]">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-[#E0E6ED] bg-gray-100 dark:bg-[#252B32] border border-gray-300 dark:border-[#3D444D] rounded shadow-sm">
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-gray-400 dark:text-[#6B7280] text-xs">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-[#30363D] px-6 py-4 bg-gray-50 dark:bg-[#252B32]/50 rounded-b-lg">
          <p className="text-sm text-gray-600 dark:text-[#B1B9C4] text-center">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-[#E0E6ED] bg-white dark:bg-[#2C333A] border border-gray-300 dark:border-[#3D444D] rounded shadow-sm">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-[#E0E6ED] bg-white dark:bg-[#2C333A] border border-gray-300 dark:border-[#3D444D] rounded shadow-sm">/</kbd> to toggle this help window
          </p>
        </div>
      </div>
    </div>
  );
}
