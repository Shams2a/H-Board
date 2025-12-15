/**
 * Export Utilities
 * Functions for exporting elements in various formats
 */

import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import type { Element } from '../types';

// PNG Export Options
interface PNGExportOptions {
  filename: string;
  includeBackground: boolean;
  scale: number;
  backgroundColor: string;
}

// JSON Export Options
interface JSONExportOptions {
  filename: string;
  includeStyles: boolean;
  boardName?: string;
}

// TXT Export Options
interface TXTExportOptions {
  filename: string;
  includeStyles: boolean;
}

/**
 * Export elements as PNG image
 */
export async function exportToPNG(
  elements: Element[],
  options: PNGExportOptions
): Promise<void> {
  if (elements.length === 0) return;

  // Get element IDs to export (including children in columns)
  const elementIds = new Set(elements.map(el => el.id));

  // Also include children of columns
  elements.forEach(el => {
    if (el.type === 'column' && el.content.childrenIds) {
      el.content.childrenIds.forEach(childId => elementIds.add(childId));
    }
  });

  // Calculate bounding box of top-level elements only (columns include their children visually)
  const topLevelElements = elements.filter(el => {
    // Check if this element is inside a column
    const isChild = elements.some(
      parent => parent.type === 'column' && parent.content.childrenIds?.includes(el.id)
    );
    return !isChild;
  });

  if (topLevelElements.length === 0) return;

  const minX = Math.min(...topLevelElements.map(el => el.position.x));
  const minY = Math.min(...topLevelElements.map(el => el.position.y));
  const maxX = Math.max(...topLevelElements.map(el => el.position.x + el.size.width));
  const maxY = Math.max(...topLevelElements.map(el => el.position.y + el.size.height));

  const padding = 40;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.backgroundColor = options.includeBackground ? options.backgroundColor : 'transparent';
  container.style.overflow = 'visible';

  // Clone and position elements
  const canvasContent = document.querySelector('.canvas-container > div');
  if (canvasContent) {
    const clone = canvasContent.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.position = 'relative';
    clone.style.left = `${-minX + padding}px`;
    clone.style.top = `${-minY + padding}px`;
    clone.style.width = `${width}px`;
    clone.style.height = `${height}px`;

    // Remove elements not in the export list (only top-level elements)
    const elementCards = clone.querySelectorAll(':scope > .relative > .element-card');
    elementCards.forEach((card) => {
      const cardElement = card as HTMLElement;
      // Check if this element should be included by matching position
      const left = parseFloat(cardElement.style.left);
      const top = parseFloat(cardElement.style.top);

      const shouldInclude = topLevelElements.some(el => {
        return Math.abs(el.position.x - left) < 1 && Math.abs(el.position.y - top) < 1;
      });

      if (!shouldInclude) {
        cardElement.remove();
      }
    });

    // Remove selection indicators and other UI elements
    clone.querySelectorAll('.selected, .ring-2, .ring-primary-500').forEach(el => {
      el.classList.remove('selected', 'ring-2', 'ring-primary-500', 'border-primary-400', 'border-primary-500');
    });

    // Remove resize handles
    clone.querySelectorAll('[class*="cursor-se-resize"], [class*="cursor-nw-resize"]').forEach(el => {
      el.remove();
    });

    container.appendChild(clone);
  }

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: options.scale,
      backgroundColor: options.includeBackground ? options.backgroundColor : null,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: width,
      height: height
    });

    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${options.filename}.png`);
      }
    }, 'image/png');
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Export elements as JSON
 */
export function exportToJSON(
  elements: Element[],
  options: JSONExportOptions
): void {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    boardName: options.boardName || 'Untitled',
    elementCount: elements.length,
    elements: elements.map(el => {
      if (options.includeStyles) {
        return el;
      } else {
        // Strip styles for plain export
        const { style, ...rest } = el;
        return rest;
      }
    })
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  saveAs(blob, `${options.filename}.json`);
}

/**
 * Export elements as plain text
 */
export function exportToTXT(
  elements: Element[],
  options: TXTExportOptions
): void {
  const lines: string[] = [];

  // Sort elements by position (top to bottom, left to right)
  const sortedElements = [...elements].sort((a, b) => {
    if (Math.abs(a.position.y - b.position.y) < 50) {
      return a.position.x - b.position.x;
    }
    return a.position.y - b.position.y;
  });

  for (const element of sortedElements) {
    switch (element.type) {
      case 'note': {
        const text = extractTextFromHTML(element.content.text || '');
        if (text) {
          if (options.includeStyles) {
            lines.push(`[Note]`);
            lines.push(text);
            lines.push('');
          } else {
            lines.push(text);
            lines.push('');
          }
        }
        break;
      }

      case 'column': {
        if (options.includeStyles) {
          lines.push(`[Column: ${element.content.title}]`);
          lines.push('---');
        } else {
          lines.push(element.content.title);
          lines.push('---');
        }
        lines.push('');
        break;
      }

      case 'board': {
        if (options.includeStyles) {
          lines.push(`[Board Link: ${element.content.title}]`);
        } else {
          lines.push(`Board: ${element.content.title}`);
        }
        if (element.content.description) {
          lines.push(element.content.description);
        }
        lines.push('');
        break;
      }

      case 'link': {
        if (options.includeStyles) {
          lines.push(`[Link: ${element.content.title || element.content.url}]`);
          lines.push(element.content.url);
        } else {
          lines.push(element.content.title || element.content.url);
          lines.push(element.content.url);
        }
        if (element.content.description) {
          lines.push(element.content.description);
        }
        lines.push('');
        break;
      }

      case 'todo': {
        if (options.includeStyles) {
          lines.push(`[Todo List]`);
        }
        for (const item of element.content.items || []) {
          const checkbox = item.completed ? '[x]' : '[ ]';
          lines.push(`${checkbox} ${item.text}`);
        }
        lines.push('');
        break;
      }

      case 'table': {
        if (options.includeStyles) {
          lines.push(`[Table]`);
        }
        // Headers
        if (element.content.headers) {
          lines.push(element.content.headers.join('\t|\t'));
          lines.push('-'.repeat(element.content.headers.join('\t|\t').length));
        }
        // Rows
        for (const row of element.content.rows || []) {
          const rowText = row.map((cell: any) => cell.value || '').join('\t|\t');
          lines.push(rowText);
        }
        lines.push('');
        break;
      }

      case 'file': {
        if (options.includeStyles) {
          lines.push(`[File: ${element.content.fileName}]`);
        } else {
          lines.push(`File: ${element.content.fileName}`);
        }
        lines.push('');
        break;
      }

      case 'section': {
        if (options.includeStyles) {
          lines.push(`[Section: ${element.content.title || 'Untitled'}]`);
        } else if (element.content.title) {
          lines.push(element.content.title);
        }
        lines.push('');
        break;
      }

      // Skip visual-only elements in TXT export
      case 'image':
      case 'line':
      case 'drawing':
      case 'shape':
        if (options.includeStyles) {
          lines.push(`[${element.type}]`);
          lines.push('');
        }
        break;
    }
  }

  const textContent = lines.join('\n').trim();
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${options.filename}.txt`);
}

/**
 * Extract plain text from HTML content
 */
function extractTextFromHTML(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}
