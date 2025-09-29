// src/services/ebook-streaming.service.ts
import { hubspotClient } from './hubspot/client';
import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import * as epubParser from 'epub-parser';

export interface EbookMetadata {
  id: string;
  name: string;
  extension: string;
  totalPages: number;
  format: 'pdf' | 'epub' | 'other';
  size: number;
  estimatedReadingTime?: number; // in minutes
  chapters?: string[]; // For EPUB files
  author?: string;
  title?: string;
}

export interface PageData {
  pageNumber: number;
  totalPages: number;
  content: string; // base64 image or HTML content
  contentType: 'image' | 'html';
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  chapterTitle?: string; // For EPUB files
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
 * Extract EPUB metadata using epub-parser
 */
const extractEpubMetadata = async (fileBuffer: Buffer): Promise<{ totalPages: number; title?: string; author?: string; chapters: string[] }> => {
  try {
    const epub = await epubParser.parse(fileBuffer);
    const chapters = epub.spine.map((item: any) => item.title || `Chapter ${item.index + 1}`);

    return {
      totalPages: chapters.length,
      title: epub.metadata?.title,
      author: epub.metadata?.creator,
      chapters
    };
  } catch (error) {
    console.error('Error parsing EPUB:', error);
    throw error;
  }
};

/**
 * Get ebook metadata including accurate page count through actual file parsing
 */
export const getEbookFileMetadata = async (fileId: string): Promise<EbookMetadata> => {
  try {
    // Get file details from HubSpot
    const file = await getFileDetails(fileId);

    const extension = file.extension?.toLowerCase() || '';
    let totalPages = 1;
    let format: 'pdf' | 'epub' | 'other' = 'other';
    let chapters: string[] | undefined;
    let title: string | undefined;
    let author: string | undefined;

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
    } else if (extension === 'epub') {
      format = 'epub';
      try {
        // Download and parse EPUB for accurate metadata
        const fileBuffer = await downloadFileContent(file.url);
        const epubData = await extractEpubMetadata(fileBuffer);
        totalPages = epubData.totalPages;
        chapters = epubData.chapters;
        title = epubData.title;
        author = epubData.author;
      } catch (error) {
        console.error('Failed to extract EPUB metadata, using fallback:', error);
        // Fallback to file size estimation
        totalPages = Math.max(1, Math.ceil(file.size / 102400));
      }
    }

    // Estimate reading time (assuming 250 words per minute, 300 words per page for PDF, 500 for EPUB)
    const wordsPerPage = format === 'epub' ? 500 : 300;
    const estimatedReadingTime = Math.ceil((totalPages * wordsPerPage) / 250);

    return {
      id: fileId,
      name: file.name,
      extension,
      totalPages,
      format,
      size: file.size,
      estimatedReadingTime,
      chapters,
      title,
      author
    };
  } catch (error) {
    console.error('Error getting ebook metadata:', error);
    throw error;
  }
};

/**
 * Extract EPUB chapter content
 */
const extractEpubChapterContent = async (fileBuffer: Buffer, chapterIndex: number): Promise<string> => {
  try {
    const epub = await epubParser.parse(fileBuffer);
    const chapter = epub.spine[chapterIndex - 1]; // Convert to 0-based index

    if (!chapter) {
      throw new Error(`Chapter ${chapterIndex} not found`);
    }

    // Get the chapter content
    const chapterContent = await epub.getChapter(chapter.id);
    const $ = cheerio.load(chapterContent);

    // Remove script tags and clean up
    $('script').remove();
    $('style').remove();

    // Get text content and format it nicely
    let content = $.html();

    // Add some basic styling for better readability
    content = `
      <div style="max-width: 800px; margin: 0 auto; padding: 2rem; font-family: 'Georgia', serif; line-height: 1.8; color: #333;">
        <h1 style="font-size: 2rem; margin-bottom: 2rem; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 0.5rem;">
          ${chapter.title || `Chapter ${chapterIndex}`}
        </h1>
        <div style="font-size: 1.1rem;">
          ${content}
        </div>
      </div>
    `;

    return content;
  } catch (error) {
    console.error('Error extracting EPUB chapter:', error);
    throw error;
  }
};

/**
 * Stream a specific page of an ebook with enhanced EPUB support
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
    let chapterTitle: string | undefined;

    if (metadata.format === 'pdf') {
      // Return the actual PDF URL - frontend will handle page rendering
      content = file.url;
      contentType = 'image'; // We'll render it as image on frontend
    } else if (metadata.format === 'epub') {
      try {
        // Download EPUB and extract chapter content
        const fileBuffer = await downloadFileContent(file.url);
        content = await extractEpubChapterContent(fileBuffer, pageNumber);
        contentType = 'html';
        chapterTitle = metadata.chapters?.[pageNumber - 1];
      } catch (error) {
        console.error('Failed to extract EPUB content, using fallback:', error);
        // Fallback content
        chapterTitle = metadata.chapters?.[pageNumber - 1] || `Chapter ${pageNumber}`;
        content = `
          <div style="max-width: 800px; margin: 0 auto; padding: 2rem; font-family: 'Georgia', serif; line-height: 1.8; color: #333; text-align: center;">
            <h1 style="font-size: 2rem; margin-bottom: 2rem; color: #2c3e50;">${chapterTitle}</h1>
            <div style="background: #f8f9fa; padding: 2rem; border-radius: 8px; border-left: 4px solid #3498db;">
              <p style="font-size: 1.1rem; margin-bottom: 1rem;">This chapter is being processed...</p>
              <p style="color: #666; font-style: italic;">Please try again in a moment, or contact support if the issue persists.</p>
            </div>
          </div>
        `;
        contentType = 'html';
      }
    } else {
      throw new Error(`Unsupported format: ${metadata.extension}`);
    }

    return {
      pageNumber,
      totalPages: metadata.totalPages,
      content,
      contentType,
      hasNextPage: pageNumber < metadata.totalPages,
      hasPreviousPage: pageNumber > 1,
      chapterTitle
    };
  } catch (error) {
    console.error('Error streaming ebook page:', error);
    throw error;
  }
};