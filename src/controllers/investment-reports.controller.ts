// src/controllers/investment-reports.controller.ts
import { Request, Response } from 'express';
import { getInvestmentReports, getFilesByFolder, searchFiles } from '../services/hubspot/files';
import { AuthenticatedRequest } from '../middleware/auth';
import { streamInvestmentReportPage, getInvestmentReportMetadata } from '../services/investment-reports.service';

/**
 * Get all investment reports from HubSpot (without download URLs)
 */
export const getAllInvestmentReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = await getInvestmentReports();

    // Remove download URLs and add reader metadata
    const safeReports = reports.map(report => ({
      id: report.id,
      name: report.name,
      extension: report.extension,
      type: report.type,
      size: report.size,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      path: report.path,
      folder: report.folder,
      // Remove: url field
      isReadable: ['pdf'].includes(report.extension?.toLowerCase() || '')
    }));

    res.status(200).json({
      success: true,
      data: safeReports,
      total: safeReports.length
    });
  } catch (error) {
    console.error('Error fetching investment reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment reports from HubSpot',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Search investment reports (without download URLs)
 */
export const searchInvestmentReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    if (!search || typeof search !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
      return;
    }

    const reports = await searchFiles(search, { type: 'IMG' });

    // Filter for report formats and the correct folder
    const reportExtensions = ['pdf', 'doc', 'docx'];
    const filteredReports = reports.filter(file =>
      reportExtensions.some(ext => file.extension?.toLowerCase() === ext) &&
      file.folder?.includes('2025 Investment Reports PDFs')
    );

    // Remove download URLs and add reader metadata
    const safeReports = filteredReports.map(report => ({
      id: report.id,
      name: report.name,
      extension: report.extension,
      type: report.type,
      size: report.size,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      path: report.path,
      folder: report.folder,
      isReadable: ['pdf'].includes(report.extension?.toLowerCase() || '')
    }));

    res.status(200).json({
      success: true,
      data: safeReports,
      total: safeReports.length
    });
  } catch (error) {
    console.error('Error searching investment reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search investment reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get investment report metadata (page count, format info, etc.)
 */
export const getInvestmentReportMetadataController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
      return;
    }

    const metadata = await getInvestmentReportMetadata(fileId);

    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('Error getting investment report metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get investment report metadata',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Stream a specific page of an investment report
 */
export const streamInvestmentReportPageController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const pageData = await streamInvestmentReportPage(fileId, pageNumber, format as string);

    res.status(200).json({
      success: true,
      data: pageData
    });
  } catch (error) {
    console.error('Error streaming investment report page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stream investment report page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get investment reports from specific folder (without download URLs)
 */
export const getInvestmentReportsByFolder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { folderName } = req.params;

    if (!folderName) {
      res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
      return;
    }

    const reports = await getFilesByFolder(decodeURIComponent(folderName));

    // Filter for report formats and remove download URLs
    const reportExtensions = ['pdf', 'doc', 'docx'];
    const filteredReports = reports.filter(file =>
      reportExtensions.some(ext => file.extension?.toLowerCase() === ext)
    );

    const safeReports = filteredReports.map(report => ({
      id: report.id,
      name: report.name,
      extension: report.extension,
      type: report.type,
      size: report.size,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      path: report.path,
      folder: report.folder,
      isReadable: ['pdf'].includes(report.extension?.toLowerCase() || '')
    }));

    res.status(200).json({
      success: true,
      data: safeReports,
      total: safeReports.length,
      folder: folderName
    });
  } catch (error) {
    console.error('Error fetching investment reports from folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment reports from folder',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};