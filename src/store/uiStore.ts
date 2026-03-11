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
  /** Zoom centered on a specific point (cursor position in client coords) */
  zoomAtPoint: (newZoom: number, clientX: number, clientY: number) => void;
  /** Zoom to fit all given elements in view */
  zoomToFit: (elements: Element[], padding?: number) => void;
  /** Zoom to fit specific elements (selection) in view */
  zoomToSelection: (elements: Element[], padding?: number) => void;
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

/**
 * Helper: compute zoom & pan to fit a bounding box into the viewport.
 */
function computeFitView(
  minX: number, minY: number, maxX: number, maxY: number,
  padding: number
) {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  const contentW = maxX - minX + padding * 2;
  const contentH = maxY - minY + padding * 2;

  // Fit the content into the viewport
  const newZoom = Math.max(0.25, Math.min(2, Math.min(vpW / contentW, vpH / contentH)));

  // Center the content
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const newPanX = (vpW / 2) / newZoom - centerX;
  const newPanY = (vpH / 2) / newZoom - centerY;

  return { zoom: newZoom, panX: newPanX, panY: newPanY };
}

export const useUIStore = create<UIState>((set, get) => ({
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
    const clampedZoom = Math.max(0.25, Math.min(2, zoom));
    set({ zoom: clampedZoom });
  },

  zoomAtPoint: (newZoom: number, clientX: number, clientY: number) => {
    const { zoom, panX, panY } = get();
    const clampedZoom = Math.max(0.25, Math.min(2, newZoom));

    // The point under the cursor in canvas space before zoom:
    //   canvasX = clientX / oldZoom - panX
    // After zoom, we want the same canvasX under the cursor:
    //   clientX / newZoom - newPanX = canvasX
    // => newPanX = clientX / newZoom - canvasX
    const canvasX = clientX / zoom - panX;
    const canvasY = clientY / zoom - panY;

    const newPanX = clientX / clampedZoom - canvasX;
    const newPanY = clientY / clampedZoom - canvasY;

    set({ zoom: clampedZoom, panX: newPanX, panY: newPanY });
  },

  zoomToFit: (elements: Element[], padding = 80) => {
    if (elements.length === 0) {
      set({ zoom: 1, panX: 0, panY: 0 });
      return;
    }

    const minX = Math.min(...elements.map(el => el.position.x));
    const minY = Math.min(...elements.map(el => el.position.y));
    const maxX = Math.max(...elements.map(el => el.position.x + el.size.width));
    const maxY = Math.max(...elements.map(el => el.position.y + el.size.height));

    const view = computeFitView(minX, minY, maxX, maxY, padding);
    set(view);
  },

  zoomToSelection: (elements: Element[], padding = 60) => {
    if (elements.length === 0) return;

    const minX = Math.min(...elements.map(el => el.position.x));
    const minY = Math.min(...elements.map(el => el.position.y));
    const maxX = Math.max(...elements.map(el => el.position.x + el.size.width));
    const maxY = Math.max(...elements.map(el => el.position.y + el.size.height));

    const view = computeFitView(minX, minY, maxX, maxY, padding);
    set(view);
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

// Selectors
type UIStoreState = ReturnType<typeof useUIStore.getState>;
export const selectSidebarOpen = (state: UIStoreState) => state.sidebarOpen;
export const selectZoom = (state: UIStoreState) => state.zoom;
export const selectPanX = (state: UIStoreState) => state.panX;
export const selectPanY = (state: UIStoreState) => state.panY;
export const selectPan = (state: UIStoreState) => ({ x: state.panX, y: state.panY });
export const selectActiveTool = (state: UIStoreState) => state.activeTool;
export const selectGridEnabled = (state: UIStoreState) => state.gridEnabled;
export const selectGridVisible = (state: UIStoreState) => state.gridEnabled;
export const selectSelectedElements = (state: UIStoreState) => state.selectedElements;
export const selectShowGrid = (state: UIStoreState) => state.gridEnabled;
export const selectExportModalOpen = (state: UIStoreState) => state.exportModalOpen;
export const selectSettingsModalOpen = (state: UIStoreState) => state.settingsModalOpen;
export const selectTemplateModalOpen = (state: UIStoreState) => state.templateModalOpen;
export const selectPresentationMode = (state: UIStoreState) => state.presentationMode;
export const selectSaving = (state: UIStoreState) => state.saving;
export const selectClipboard = (state: UIStoreState) => state.clipboard;
