/**
 * ExportModal Component
 * Modal for exporting board/selection in various formats
 */

import { useState } from 'react';
import { X, Download, Image, FileJson, FileText } from 'lucide-react';
import { useElementStore, useBoardStore } from '../../store';
import { exportToPNG, exportToJSON, exportToTXT } from '../../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportScope = 'canvas' | 'selection';
type ExportFormat = 'png' | 'json' | 'txt';
type TextStyle = 'styled' | 'plain';

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { elements, selectedIds } = useElementStore();
  const { getCurrentBoard } = useBoardStore();
  const currentBoard = getCurrentBoard();

  const [scope, setScope] = useState<ExportScope>('canvas');
  const [format, setFormat] = useState<ExportFormat>('png');
  const [textStyle, setTextStyle] = useState<TextStyle>('styled');
  const [includeBackground, setIncludeBackground] = useState(true);
  const [highResolution, setHighResolution] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  const elementsToExport = scope === 'selection' ? selectedElements : elements;
  const hasSelection = selectedIds.length > 0;

  const handleExport = async () => {
    if (elementsToExport.length === 0) return;

    setIsExporting(true);

    try {
      const filename = `${currentBoard?.name || 'export'}-${new Date().toISOString().slice(0, 10)}`;

      switch (format) {
        case 'png':
          await exportToPNG(elementsToExport, {
            filename,
            includeBackground,
            scale: highResolution ? 2 : 1,
            backgroundColor: currentBoard?.settings.backgroundColor || '#F5F5F5'
          });
          break;

        case 'json':
          exportToJSON(elementsToExport, {
            filename,
            includeStyles: textStyle === 'styled',
            boardName: currentBoard?.name
          });
          break;

        case 'txt':
          exportToTXT(elementsToExport, {
            filename,
            includeStyles: textStyle === 'styled'
          });
          break;
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenu à exporter
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setScope('canvas')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  scope === 'canvas'
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Canvas entier
                <span className="block text-xs opacity-70">{elements.length} éléments</span>
              </button>
              <button
                onClick={() => setScope('selection')}
                disabled={!hasSelection}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  scope === 'selection'
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                    : hasSelection
                      ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Sélection
                <span className="block text-xs opacity-70">{selectedIds.length} éléments</span>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('png')}
                className={`flex-1 py-3 px-3 rounded-lg border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                  format === 'png'
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Image className="w-5 h-5" />
                PNG
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`flex-1 py-3 px-3 rounded-lg border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                  format === 'json'
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FileJson className="w-5 h-5" />
                JSON
              </button>
              <button
                onClick={() => setFormat('txt')}
                className={`flex-1 py-3 px-3 rounded-lg border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                  format === 'txt'
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                TXT
              </button>
            </div>
          </div>

          {/* Format-specific options */}
          {format === 'png' && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBackground}
                  onChange={(e) => setIncludeBackground(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Inclure l'arrière-plan
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highResolution}
                  onChange={(e) => setHighResolution(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Haute résolution (2x)
                </span>
              </label>
            </div>
          )}

          {(format === 'json' || format === 'txt') && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Style du texte
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTextStyle('styled')}
                  className={`flex-1 py-2 px-3 rounded border text-sm transition-colors ${
                    textStyle === 'styled'
                      ? 'bg-white dark:bg-gray-800 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Avec styles
                </button>
                <button
                  onClick={() => setTextStyle('plain')}
                  className={`flex-1 py-2 px-3 rounded border text-sm transition-colors ${
                    textStyle === 'plain'
                      ? 'bg-white dark:bg-gray-800 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Texte brut
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || elementsToExport.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Export...' : 'Exporter'}
          </button>
        </div>
      </div>
    </div>
  );
}
