/**
 * Folder API Service
 * Handles all folder-related API requests
 */

import { apiClient, type ApiResponse } from './api';
import type { Folder } from '../types/folder';

export interface CreateFolderDto {
  name: string;
  color?: string;
  parentFolderId?: string | null;
}

export interface UpdateFolderDto {
  name?: string;
  color?: string;
  parentFolderId?: string | null;
}

export const folderApi = {
  /**
   * Get all folders
   */
  async getAll(): Promise<ApiResponse<Folder[]>> {
    return apiClient.get<Folder[]>('/folders');
  },

  /**
   * Get folder by ID
   */
  async getById(id: string): Promise<ApiResponse<Folder>> {
    return apiClient.get<Folder>(`/folders/${id}`);
  },

  /**
   * Get root folders (no parent)
   */
  async getRoots(): Promise<ApiResponse<Folder[]>> {
    return apiClient.get<Folder[]>('/folders/roots');
  },

  /**
   * Get child folders
   */
  async getChildren(parentId: string): Promise<ApiResponse<Folder[]>> {
    return apiClient.get<Folder[]>(`/folders/${parentId}/children`);
  },

  /**
   * Create new folder
   */
  async create(data: CreateFolderDto): Promise<ApiResponse<Folder>> {
    return apiClient.post<Folder>('/folders', data);
  },

  /**
   * Update folder
   */
  async update(id: string, data: UpdateFolderDto): Promise<ApiResponse<Folder>> {
    return apiClient.patch<Folder>(`/folders/${id}`, data);
  },

  /**
   * Delete folder (and optionally its contents)
   */
  async delete(id: string, deleteContents: boolean = false): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/folders/${id}?deleteContents=${deleteContents}`);
  },

  /**
   * Move folder to another parent
   */
  async move(id: string, parentFolderId: string | null): Promise<ApiResponse<Folder>> {
    return apiClient.patch<Folder>(`/folders/${id}/move`, { parentFolderId });
  },
};
