/**
 * Arrow Connection Store
 * Manages the state when creating arrow connections between elements
 */

import { create } from 'zustand';
import type { AnchorPosition } from '../types';

interface ArrowConnectionState {
  // Connection mode state
  isConnecting: boolean;
  startElementId: string | null;
  startAnchor: AnchorPosition | null;

  // Actions
  startConnection: (elementId: string, anchor: AnchorPosition) => void;
  completeConnection: (elementId: string, anchor: AnchorPosition) => { startElementId: string; startAnchor: AnchorPosition; endElementId: string; endAnchor: AnchorPosition } | null;
  cancelConnection: () => void;

  // Helper
  isFirstClickDone: () => boolean;
}

export const useArrowConnectionStore = create<ArrowConnectionState>((set, get) => ({
  isConnecting: false,
  startElementId: null,
  startAnchor: null,

  startConnection: (elementId: string, anchor: AnchorPosition) => {
    set({
      isConnecting: true,
      startElementId: elementId,
      startAnchor: anchor
    });
  },

  completeConnection: (elementId: string, anchor: AnchorPosition) => {
    const { startElementId, startAnchor } = get();

    if (!startElementId || !startAnchor) {
      return null;
    }

    // Can't connect to itself
    if (startElementId === elementId) {
      set({ isConnecting: false, startElementId: null, startAnchor: null });
      return null;
    }

    const result = {
      startElementId,
      startAnchor,
      endElementId: elementId,
      endAnchor: anchor
    };

    // Reset state
    set({ isConnecting: false, startElementId: null, startAnchor: null });

    return result;
  },

  cancelConnection: () => {
    set({ isConnecting: false, startElementId: null, startAnchor: null });
  },

  isFirstClickDone: () => {
    const { startElementId, startAnchor } = get();
    return startElementId !== null && startAnchor !== null;
  }
}));
