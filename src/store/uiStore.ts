/**
 * UI Store
 * Manages UI state (sidebar, toolbar, zoom, etc.)
 */

import { create } from 'zustand';
import type { ElementType, Element } from '../types';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Canvas
  zoom: number;
  panX: number;
  panY: number;
  gridEnabled: boolean;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  resetView: () => void;

  // Toolbar
  activeTool: ElementType | null;
  setActiveTool: (tool: ElementType | null) => void;

  // Modals
  exportModalOpen: boolean;
  settingsModalOpen: boolean;
  templateModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setTemplateModalOpen: (open: boolean) => void;

  // Presentation mode
  presentationMode: boolean;
  setPresentationMode: (enabled: boolean) => void;

  // Loading states
  saving: boolean;
  setSaving: (saving: boolean) => void;

  // Selection
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  toggleElementSelection: (id: string) => void;
  clearSelection: () => void;

  // Clipboard
  clipboard: Element[];
  setClipboard: (elements: Element[]) => void;
  clearClipboard: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  // Canvas
  zoom: 1,
  panX: 0,
  panY: 0,
  gridEnabled: true,
  setZoom: (zoom: number) => {
    // Clamp zoom between 0.25 and 2
    const clampedZoom = Math.max(0.25, Math.min(2, zoom));
    set({ zoom: clampedZoom });
  },
  setPan: (x: number, y: number) => set({ panX: x, panY: y }),
  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),

  // Toolbar
  activeTool: null,
  setActiveTool: (tool: ElementType | null) => set({ activeTool: tool }),

  // Modals
  exportModalOpen: false,
  settingsModalOpen: false,
  templateModalOpen: false,
  setExportModalOpen: (open: boolean) => set({ exportModalOpen: open }),
  setSettingsModalOpen: (open: boolean) => set({ settingsModalOpen: open }),
  setTemplateModalOpen: (open: boolean) => set({ templateModalOpen: open }),

  // Presentation mode
  presentationMode: false,
  setPresentationMode: (enabled: boolean) => set({ presentationMode: enabled }),

  // Loading states
  saving: false,
  setSaving: (saving: boolean) => set({ saving: saving }),

  // Selection
  selectedElements: [],
  setSelectedElements: (ids: string[]) => set({ selectedElements: ids }),
  toggleElementSelection: (id: string) =>
    set((state) => ({
      selectedElements: state.selectedElements.includes(id)
        ? state.selectedElements.filter((eid) => eid !== id)
        : [...state.selectedElements, id]
    })),
  clearSelection: () => set({ selectedElements: [] }),

  // Clipboard
  clipboard: [],
  setClipboard: (elements: Element[]) => set({ clipboard: elements }),
  clearClipboard: () => set({ clipboard: [] })
}));
