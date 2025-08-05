// src/services/hubspot/files.ts
import { hubspotClient } from './client';
import fs from 'fs'

export interface HubSpotFile {
  id: string;
  name: string;
  extension: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  encoding?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  path?: string;
  folder?: string;
}

export interface HubSpotFileResponse {
  results: HubSpotFile[];
  total: number;
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

export interface FileSearchOptions {
  folder?: string;
  type?: string;
  name?: string;
  extension?: string;
  limit?: number;
  offset?: number;
  sort?: string[];
}

/**
 * Get all files from HubSpot with optional filtering
 */
export const getFiles = async (options: FileSearchOptions = {}): Promise<HubSpotFileResponse> => {
  try {
    const params: Record<string, any> = {};
    
    if (options.limit) params.limit = options.limit;
    if (options.offset) params.offset = options.offset;
    if (options.sort) params.sort = options.sort;
    
    const response = await hubspotClient.get('/filemanager/api/v3/files', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching files from HubSpot:', error);
    throw error;
  }
};

/**
 * Get files from a specific folder by name
 */
export const getFilesByFolder = async (folderName: string, options: FileSearchOptions = {}): Promise<HubSpotFile[]> => {
  try {
    const response = await hubspotClient.get('/files/v3/files/search?path=Updated Ebooks (Oct. 2024)');
    console.log(response.data.results)
    return response.data.results;
  } catch (error) {
    console.error('Error fetching files from folder:', error);
    throw error;
  }
};

/**
 * Get ebooks specifically from the "ALL FINAL EBOOKS" folder
 */
export const getEbooks = async (): Promise<HubSpotFile[]> => {
  try {
    const ebooks = await getFilesByFolder('ALL FINAL EBOOKS', {
      type: 'IMG', // HubSpot file type for documents/PDFs
      limit: 100
    });

    // Filter for common ebook formats
    const ebookExtensions = ['pdf', 'epub', 'mobi', 'azw', 'azw3', 'png'];
    const filteredEbooks = ebooks.filter(file => 
      ebookExtensions.some(ext => file.extension?.toLowerCase() === ext)
    );
    
    return filteredEbooks;
  } catch (error) {
    console.error('Error fetching ebooks:', error);
    throw error;
  }
};

/**
 * Get file content/download URL
 */
export const getFileDownloadUrl = async (fileId: string): Promise<string> => {
  try {
    const response = await hubspotClient.get(`/filemanager/api/v3/files/${fileId}`);
    return response.data.url;
  } catch (error) {
    console.error('Error getting file download URL:', error);
    throw error;
  }
};

/**
 * Search files by name pattern
 */
export const searchFiles = async (searchTerm: string, options: FileSearchOptions = {}): Promise<HubSpotFile[]> => {
  try {
    const allFiles = await getFiles({ limit: 1000, ...options });
    
    // Filter files by name containing the search term
    const filteredFiles = allFiles.results.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredFiles;
  } catch (error) {
    console.error('Error searching files:', error);
    throw error;
  }
};