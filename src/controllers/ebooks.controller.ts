// src/controllers/ebooks.controller.ts
import { Request, Response } from 'express';
import { getEbooks, getFilesByFolder, getFileDownloadUrl, searchFiles } from '../services/hubspot/files';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get all ebooks from HubSpot
 */
export const getAllEbooks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ebooks = await getEbooks();
    
    res.status(200).json({
      success: true,
      data: ebooks,
      total: ebooks.length
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
 * Get ebooks by search term
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
    
    res.status(200).json({
      success: true,
      data: filteredEbooks,
      total: filteredEbooks.length
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
 * Get download URL for a specific ebook
 */
export const getEbookDownloadUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
      return;
    }
    
    const downloadUrl = await getFileDownloadUrl(fileId);
    
    res.status(200).json({
      success: true,
      data: {
        fileId,
        downloadUrl
      }
    });
  } catch (error) {
    console.error('Error getting ebook download URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ebook download URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get ebooks from a specific folder
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
    
    const files = await getFilesByFolder(decodeURIComponent(folderName));
    
    // Filter for ebook formats
    const ebookExtensions = ['pdf', 'epub', 'mobi', 'azw', 'azw3'];
    const ebooks = files.filter(file => 
      ebookExtensions.some(ext => file.extension?.toLowerCase() === ext)
    );
    
    res.status(200).json({
      success: true,
      data: ebooks,
      total: ebooks.length,
      folder: folderName
    });
  } catch (error) {
    console.error('Error fetching ebooks from folder:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ebooks from folder`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};