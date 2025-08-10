// src/controllers/ebooks.controller.ts
import { Request, Response } from 'express';
import { getEbooks, getFilesByFolder, searchFiles } from '../services/hubspot/files';
import { AuthenticatedRequest } from '../middleware/auth';
import { streamEbookPage, getEbookFileMetadata } from '../services/ebook-streaming.service';

/**
 * Get all ebooks from HubSpot (without download URLs)
 */
export const getAllEbooks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ebooks = await getEbooks();
    
    // Remove download URLs and add reader metadata
    const safeEbooks = ebooks.map(ebook => ({
      id: ebook.id,
      name: ebook.name,
      extension: ebook.extension,
      type: ebook.type,
      size: ebook.size,
      createdAt: ebook.createdAt,
      updatedAt: ebook.updatedAt,
      path: ebook.path,
      folder: ebook.folder,
      // Remove: url field
      isReadable: ['pdf', 'epub'].includes(ebook.extension?.toLowerCase() || '')
    }));
    
    res.status(200).json({
      success: true,
      data: safeEbooks,
      total: safeEbooks.length
    });
  } catch (error) {
    console.error('Error fetching ebooks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ebooks from HubSpot',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Search ebooks (without download URLs)
 */
export const searchEbooks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    
    if (!search || typeof search !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
      return;
    }
    
    const ebooks = await searchFiles(search, { type: 'IMG' });
    
    // Filter for ebook formats
    const ebookExtensions = ['pdf', 'epub', 'mobi', 'azw', 'azw3'];
    const filteredEbooks = ebooks.filter(file => 
      ebookExtensions.some(ext => file.extension?.toLowerCase() === ext)
    );
    
    // Remove download URLs and add reader metadata
    const safeEbooks = filteredEbooks.map(ebook => ({
      id: ebook.id,
      name: ebook.name,
      extension: ebook.extension,
      type: ebook.type,
      size: ebook.size,
      createdAt: ebook.createdAt,
      updatedAt: ebook.updatedAt,
      path: ebook.path,
      folder: ebook.folder,
      isReadable: ['pdf', 'epub'].includes(ebook.extension?.toLowerCase() || '')
    }));
    
    res.status(200).json({
      success: true,
      data: safeEbooks,
      total: safeEbooks.length
    });
  } catch (error) {
    console.error('Error searching ebooks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search ebooks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get ebook metadata (page count, format info, etc.)
 */
export const getEbookMetadata = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
      return;
    }
    
    const metadata = await getEbookFileMetadata(fileId);
    
    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('Error getting ebook metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ebook metadata',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Stream a specific page of an ebook
 */
export const streamEbookPageController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const { page = '1', format = 'image' } = req.query;
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
      return;
    }
    
    const pageNumber = parseInt(page as string, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      res.status(400).json({
        success: false,
        message: 'Valid page number is required'
      });
      return;
    }
    
    const pageData = await streamEbookPage(fileId, pageNumber, format as string);
    
    res.status(200).json({
      success: true,
      data: pageData
    });
  } catch (error) {
    console.error('Error streaming ebook page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stream ebook page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get ebooks from specific folder (without download URLs)
 */
export const getEbooksByFolder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { folderName } = req.params;
    
    if (!folderName) {
      res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
      return;
    }
    
    const ebooks = await getFilesByFolder(decodeURIComponent(folderName));
    
    // Filter for ebook formats and remove download URLs
    const ebookExtensions = ['pdf', 'epub', 'mobi', 'azw', 'azw3'];
    const filteredEbooks = ebooks.filter(file => 
      ebookExtensions.some(ext => file.extension?.toLowerCase() === ext)
    );
    
    const safeEbooks = filteredEbooks.map(ebook => ({
      id: ebook.id,
      name: ebook.name,
      extension: ebook.extension,
      type: ebook.type,
      size: ebook.size,
      createdAt: ebook.createdAt,
      updatedAt: ebook.updatedAt,
      path: ebook.path,
      folder: ebook.folder,
      isReadable: ['pdf', 'epub'].includes(ebook.extension?.toLowerCase() || '')
    }));
    
    res.status(200).json({
      success: true,
      data: safeEbooks,
      total: safeEbooks.length,
      folder: folderName
    });
  } catch (error) {
    console.error('Error fetching ebooks from folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ebooks from folder',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};