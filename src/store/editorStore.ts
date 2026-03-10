/**
 * Editor Store
 * Manages active TipTap editor instance for text customization
 */

import { create } from 'zustand';
import type { Editor } from '@tiptap/react';

interface EditorState {
  activeEditor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeEditor: null,
  setActiveEditor: (editor) => set({ activeEditor: editor }),
}));

// Selectors
type EditorStoreState = ReturnType<typeof useEditorStore.getState>;
export const selectActiveEditor = (state: EditorStoreState) => state.activeEditor;
