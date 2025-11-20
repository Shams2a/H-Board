/**
 * Element API Service
 * Handles all element-related API requests
 */

import { apiClient, type ApiResponse } from './api';
import type { BoardElement } from '../types';

export interface CreateElementDto {
  boardId: string;
  type: BoardElement['type'];
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: Partial<BoardElement['style']>;
  content?: Record<string, unknown>;
  parentId?: string | null;
}

export interface UpdateElementDto {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  style?: Partial<BoardElement['style']>;
  content?: Record<string, unknown>;
  parentId?: string | null;
  locked?: boolean;
  zIndex?: number;
}

export interface BulkUpdateDto {
  elements: Array<{
    id: string;
    updates: UpdateElementDto;
  }>;
}

export const elementApi = {
  /**
   * Get all elements for a board
   */
  async getByBoard(boardId: string): Promise<ApiResponse<BoardElement[]>> {
    return apiClient.get<BoardElement[]>(`/elements/board/${boardId}`);
  },

  /**
   * Get element by ID
   */
  async getById(id: string): Promise<ApiResponse<BoardElement>> {
    return apiClient.get<BoardElement>(`/elements/${id}`);
  },

  /**
   * Get child elements (elements inside a container)
   */
  async getChildren(parentId: string): Promise<ApiResponse<BoardElement[]>> {
    return apiClient.get<BoardElement[]>(`/elements/${parentId}/children`);
  },

  /**
   * Create new element
   */
  async create(data: CreateElementDto): Promise<ApiResponse<BoardElement>> {
    return apiClient.post<BoardElement>('/elements', data);
  },

  /**
   * Update element
   */
  async update(id: string, data: UpdateElementDto): Promise<ApiResponse<BoardElement>> {
    return apiClient.patch<BoardElement>(`/elements/${id}`, data);
  },

  /**
   * Bulk update multiple elements (for performance)
   */
  async bulkUpdate(data: BulkUpdateDto): Promise<ApiResponse<BoardElement[]>> {
    return apiClient.patch<BoardElement[]>('/elements/bulk', data);
  },

  /**
   * Delete element
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/elements/${id}`);
  },

  /**
   * Bulk delete multiple elements
   */
  async bulkDelete(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/elements/bulk-delete', { ids });
  },

  /**
   * Duplicate element
   */
  async duplicate(id: string): Promise<ApiResponse<BoardElement>> {
    return apiClient.post<BoardElement>(`/elements/${id}/duplicate`);
  },

  /**
   * Move element to another board
   */
  async moveToBoard(id: string, targetBoardId: string): Promise<ApiResponse<BoardElement>> {
    return apiClient.patch<BoardElement>(`/elements/${id}/move`, { targetBoardId });
  },

  /**
   * Update element z-index
   */
  async updateZIndex(id: string, zIndex: number): Promise<ApiResponse<BoardElement>> {
    return apiClient.patch<BoardElement>(`/elements/${id}/z-index`, { zIndex });
  },

  /**
   * Bring element to front
   */
  async bringToFront(id: string): Promise<ApiResponse<BoardElement>> {
    return apiClient.post<BoardElement>(`/elements/${id}/bring-to-front`);
  },

  /**
   * Send element to back
   */
  async sendToBack(id: string): Promise<ApiResponse<BoardElement>> {
    return apiClient.post<BoardElement>(`/elements/${id}/send-to-back`);
  },

  /**
   * Lock/unlock element
   */
  async setLocked(id: string, locked: boolean): Promise<ApiResponse<BoardElement>> {
    return apiClient.patch<BoardElement>(`/elements/${id}/locked`, { locked });
  },
};
