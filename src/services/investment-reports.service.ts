// src/services/investment-reports.service.ts
import { hubspotClient } from './hubspot/client';
import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';

export interface InvestmentReportMetadata {
  id: string;
  name: string;
  extension: string;
  totalPages: number;
  format: 'pdf' | 'other';
  size: number;
  estimatedReadingTime?: number; // in minutes
  author?: string;
  title?: string;
  reportDate?: string;
  reportType?: string;
}

export interface ReportPageData {
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
 * Download file content from HubSpot
 */
const downloadFileContent = async (fileUrl: string): Promise<Buffer> => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Extract PDF metadata using pdf-parse
 */
const extractPdfMetadata = async (fileBuffer: Buffer): Promise<{ totalPages: number; title?: string; author?: string }> => {
  try {
    const data = await pdfParse(fileBuffer);
    return {
      totalPages: data.numpages,
      title: data.info?.Title || undefined,
      author: data.info?.Author || undefined
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
};

/**
 * Extract report type and date from filename
 */
const extractReportInfo = (filename: string): { reportType?: string; reportDate?: string } => {
  const cleanName = filename.replace(/\.(pdf|doc|docx)$/i, '');

  // Try to extract year from filename
  const yearMatch = cleanName.match(/20\d{2}/);
  const reportDate = yearMatch ? yearMatch[0] : undefined;

  // Determine report type based on filename patterns
  let reportType = 'Investment Report';
  if (cleanName.toLowerCase().includes('quarterly')) {
    reportType = 'Quarterly Report';
  } else if (cleanName.toLowerCase().includes('annual')) {
    reportType = 'Annual Report';
  } else if (cleanName.toLowerCase().includes('monthly')) {
    reportType = 'Monthly Report';
  } else if (cleanName.toLowerCase().includes('market')) {
    reportType = 'Market Analysis';
  } else if (cleanName.toLowerCase().includes('performance')) {
    reportType = 'Performance Report';
  }

  return { reportType, reportDate };
};

/**
 * Get investment report metadata including accurate page count through actual file parsing
 */
export const getInvestmentReportMetadata = async (fileId: string): Promise<InvestmentReportMetadata> => {
  try {
    // Get file details from HubSpot
    const file = await getFileDetails(fileId);

    const extension = file.extension?.toLowerCase() || '';
    let totalPages = 1;
    let format: 'pdf' | 'other' = 'other';
    let title: string | undefined;
    let author: string | undefined;

    // Extract report info from filename
    const { reportType, reportDate } = extractReportInfo(file.name);

    if (extension === 'pdf') {
      format = 'pdf';
      try {
        // Download and parse PDF for accurate metadata
        const fileBuffer = await downloadFileContent(file.url);
        const pdfData = await extractPdfMetadata(fileBuffer);
        totalPages = pdfData.totalPages;
        title = pdfData.title;
        author = pdfData.author;
      } catch (error) {
        console.error('Failed to extract PDF metadata, using fallback:', error);
        // Fallback to file size estimation
        totalPages = Math.max(1, Math.ceil(file.size / 51200));
      }
    }

    // Estimate reading time (assuming 250 words per minute, 300 words per page for PDF)
    const wordsPerPage = 300;
    const estimatedReadingTime = Math.ceil((totalPages * wordsPerPage) / 250);

    return {
      id: fileId,
      name: file.name,
      extension,
      totalPages,
      format,
      size: file.size,
      estimatedReadingTime,
      title,
      author,
      reportDate,
      reportType
    };
  } catch (error) {
    console.error('Error getting investment report metadata:', error);
    throw error;
  }
};

/**
 * Stream a specific page of an investment report
 */
export const streamInvestmentReportPage = async (
  fileId: string,
  pageNumber: number,
  format: string = 'image'
): Promise<ReportPageData> => {
  try {
    const metadata = await getInvestmentReportMetadata(fileId);

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
    console.error('Error streaming investment report page:', error);
    throw error;
  }
};