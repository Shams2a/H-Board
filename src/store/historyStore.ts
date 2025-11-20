/**
 * History Store
 * Manages undo/redo state for element operations
 */

import { create } from 'zustand';
import type { Element } from '../types';

interface HistoryEntry {
  elements: Element[];
  timestamp: number;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistory: number;

  // Actions
  pushState: (elements: Element[]) => void;
  undo: (currentElements: Element[]) => Element[] | null;
  redo: (currentElements: Element[]) => Element[] | null;
  clear: () => void;

  // Getters
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 50,

  pushState: (elements: Element[]) => {
    const state = get();
    const entry: HistoryEntry = {
      elements: JSON.parse(JSON.stringify(elements)), // Deep clone
      timestamp: Date.now()
    };

    set({
      past: [...state.past.slice(-state.maxHistory + 1), entry],
      future: [] // Clear future when new action is taken
    });
  },

  undo: (currentElements: Element[]) => {
    const state = get();
    if (state.past.length === 0) return null;

    const newPast = [...state.past];
    const previous = newPast.pop()!;

    // Save current state to future for redo
    const currentEntry: HistoryEntry = {
      elements: JSON.parse(JSON.stringify(currentElements)),
      timestamp: Date.now()
    };

    set({
      past: newPast,
      future: [currentEntry, ...state.future]
    });

    // Return the state we're restoring to
    return JSON.parse(JSON.stringify(previous.elements));
  },

  redo: (currentElements: Element[]) => {
    const state = get();
    if (state.future.length === 0) return null;

    const newFuture = [...state.future];
    const next = newFuture.shift()!;

    // Save current state to past
    const currentEntry: HistoryEntry = {
      elements: JSON.parse(JSON.stringify(currentElements)),
      timestamp: Date.now()
    };

    set({
      past: [...state.past, currentEntry],
      future: newFuture
    });

    return JSON.parse(JSON.stringify(next.elements));
  },

  clear: () => {
    set({ past: [], future: [] });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0
}));
