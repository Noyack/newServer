// src/services/hubspot/files.ts
import { hubspotClient } from './client';
import axios from 'axios';
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
    const response = await hubspotClient.get('/files/v3/files/search?path=ebooks');
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
 * Get investment reports specifically from the "2025 Investment Reports PDFs" folder
 */
export const getInvestmentReports = async (): Promise<HubSpotFile[]> => {
  try {
    const response = await hubspotClient.get('/files/v3/files/search?path=2025%20Investment%20Reports%20PDFs&limit=50');
    const reports = response.data.results;

    // Filter for PDF and document formats
    const reportExtensions = ['pdf', 'doc', 'docx'];
    const filteredReports = reports.filter((file: { extension: string; }) =>
      reportExtensions.some(ext => file.extension?.toLowerCase() === ext)
    );

    return filteredReports;
  } catch (error) {
    console.error('Error fetching investment reports:', error);
    throw error;
  }
};

/**
 * Get file content/download URL
 * NOTE: This is used internally by streaming service, not exposed to frontend
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
 * Get file content as buffer (for streaming service)
 */
export const getFileContent = async (fileId: string): Promise<Buffer> => {
  try {
    // First get the file details to get the download URL
    const fileResponse = await hubspotClient.get(`/filemanager/api/v3/files/${fileId}`);
    const fileUrl = fileResponse.data.url;
    
    // Fetch the actual file content using axios
    const contentResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(contentResponse.data);
  } catch (error) {
    console.error('Error getting file content:', error);
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