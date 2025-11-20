/**
 * Board API Service
 * Handles all board-related API requests
 */

import { apiClient, type ApiResponse } from './api';
import type { Board } from '../types/board';

export interface CreateBoardDto {
  name: string;
  description?: string;
  tags?: string[];
  folderId?: string | null;
  parentId?: string | null;
  settings?: Partial<Board['settings']>;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  tags?: string[];
  folderId?: string | null;
  parentId?: string | null;
  settings?: Partial<Board['settings']>;
}

export const boardApi = {
  /**
   * Get all boards
   */
  async getAll(): Promise<ApiResponse<Board[]>> {
    return apiClient.get<Board[]>('/boards');
  },

  /**
   * Get board by ID
   */
  async getById(id: string): Promise<ApiResponse<Board>> {
    return apiClient.get<Board>(`/boards/${id}`);
  },

  /**
   * Get boards by folder ID
   */
  async getByFolder(folderId: string): Promise<ApiResponse<Board[]>> {
    return apiClient.get<Board[]>(`/boards/folder/${folderId}`);
  },

  /**
   * Get child boards (sub-boards)
   */
  async getChildren(parentId: string): Promise<ApiResponse<Board[]>> {
    return apiClient.get<Board[]>(`/boards/${parentId}/children`);
  },

  /**
   * Create new board
   */
  async create(data: CreateBoardDto): Promise<ApiResponse<Board>> {
    return apiClient.post<Board>('/boards', data);
  },

  /**
   * Update board
   */
  async update(id: string, data: UpdateBoardDto): Promise<ApiResponse<Board>> {
    return apiClient.patch<Board>(`/boards/${id}`, data);
  },

  /**
   * Delete board
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/boards/${id}`);
  },

  /**
   * Duplicate board
   */
  async duplicate(id: string, name?: string): Promise<ApiResponse<Board>> {
    return apiClient.post<Board>(`/boards/${id}/duplicate`, { name });
  },

  /**
   * Move board to folder
   */
  async moveToFolder(id: string, folderId: string | null): Promise<ApiResponse<Board>> {
    return apiClient.patch<Board>(`/boards/${id}/move`, { folderId });
  },

  /**
   * Search boards by name or tags
   */
  async search(query: string): Promise<ApiResponse<Board[]>> {
    return apiClient.get<Board[]>(`/boards/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get recently accessed boards
   */
  async getRecent(limit: number = 10): Promise<ApiResponse<Board[]>> {
    return apiClient.get<Board[]>(`/boards/recent?limit=${limit}`);
  },
};
