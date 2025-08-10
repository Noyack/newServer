// src/services/ebook-streaming.service.ts
import { hubspotClient } from './hubspot/client';
import JSZip from 'jszip';
import * as cheerio from 'cheerio';

export interface EbookMetadata {
  id: string;
  name: string;
  extension: string;
  totalPages: number;
  format: 'pdf' | 'epub' | 'other';
  size: number;
  estimatedReadingTime?: number; // in minutes
}

export interface PageData {
  pageNumber: number;
  totalPages: number;
  content: string; // base64 image or HTML content
  contentType: 'image' | 'html';
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Get file details from HubSpot (without downloading content)
 */
const getFileDetails = async (fileId: string) => {
  try {
    const response = await hubspotClient.get(`/filemanager/api/v3/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching file details:', error);
    throw error;
  }
};

/**
 * Get ebook metadata including page count
 * For now, we'll estimate pages based on file size and return mock data
 */
export const getEbookFileMetadata = async (fileId: string): Promise<EbookMetadata> => {
  try {
    // Get file details from HubSpot
    const file = await getFileDetails(fileId);
    
    const extension = file.extension?.toLowerCase() || '';
    let totalPages = 1;
    let format: 'pdf' | 'epub' | 'other' = 'other';
    
    if (extension === 'pdf') {
      format = 'pdf';
      // Estimate pages based on file size (rough estimate: 50KB per page)
      totalPages = Math.max(1, Math.ceil(file.size / 51200));
    } else if (extension === 'epub') {
      format = 'epub';
      // Estimate chapters/sections (rough estimate: 100KB per chapter)
      totalPages = Math.max(1, Math.ceil(file.size / 102400));
    }
    
    // Estimate reading time (assuming 250 words per minute, 300 words per page)
    const estimatedReadingTime = Math.ceil((totalPages * 300) / 250);
    
    return {
      id: fileId,
      name: file.name,
      extension,
      totalPages,
      format,
      size: file.size,
      estimatedReadingTime
    };
  } catch (error) {
    console.error('Error getting ebook metadata:', error);
    throw error;
  }
};

/**
 * Stream a specific page of an ebook
 * For now, we'll return the full file URL and let frontend handle it
 */
export const streamEbookPage = async (
  fileId: string, 
  pageNumber: number, 
  format: string = 'image'
): Promise<PageData> => {
  try {
    const metadata = await getEbookFileMetadata(fileId);
    
    if (pageNumber > metadata.totalPages || pageNumber < 1) {
      throw new Error(`Page ${pageNumber} does not exist. Total pages: ${metadata.totalPages}`);
    }
    
    // Get the file URL from HubSpot
    const file = await getFileDetails(fileId);
    
    let content: string;
    let contentType: 'image' | 'html';
    
    if (metadata.format === 'pdf') {
      // Return the actual PDF URL - frontend will handle page rendering
      content = file.url;
      contentType = 'image'; // We'll render it as image on frontend
    } else if (metadata.format === 'epub') {
      // For EPUB, return a simple HTML page indicating the chapter
      content = `
        <div style="padding: 2rem; font-family: serif; line-height: 1.6;">
          <h1>Chapter ${pageNumber}</h1>
          <p>This is a placeholder for chapter ${pageNumber} of ${metadata.name}.</p>
          <p><em>EPUB rendering will be implemented once the server issues are resolved.</em></p>
        </div>
      `;
      contentType = 'html';
    } else {
      throw new Error(`Unsupported format: ${metadata.extension}`);
    }
    
    return {
      pageNumber,
      totalPages: metadata.totalPages,
      content,
      contentType,
      hasNextPage: pageNumber < metadata.totalPages,
      hasPreviousPage: pageNumber > 1
    };
  } catch (error) {
    console.error('Error streaming ebook page:', error);
    throw error;
  }
};