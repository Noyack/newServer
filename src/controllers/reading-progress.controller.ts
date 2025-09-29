// src/controllers/reading-progress.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  updateReadingProgress,
  getReadingProgress,
  getUserReadingProgress,
  addBookmark,
  getBookmarks,
  removeBookmark,
  addReadingNote,
  getReadingNotes,
  updateReadingNote,
  removeReadingNote,
} from '../services/reading-progress.service';

/**
 * Update reading progress for an ebook
 */
export const updateProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ebookId, currentPage, totalPages, timeSpentReading } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!ebookId || !currentPage || !totalPages) {
      res.status(400).json({
        success: false,
        message: 'ebookId, currentPage, and totalPages are required'
      });
      return;
    }

    const progressId = await updateReadingProgress({
      userId,
      ebookId,
      currentPage,
      totalPages,
      timeSpentReading
    });

    res.status(200).json({
      success: true,
      data: { progressId },
      message: 'Reading progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating reading progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reading progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get reading progress for a specific ebook
 */
export const getProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ebookId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!ebookId) {
      res.status(400).json({
        success: false,
        message: 'Ebook ID is required'
      });
      return;
    }

    const progress = await getReadingProgress(userId, ebookId);

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error getting reading progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reading progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all reading progress for the authenticated user
 */
export const getAllProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const progress = await getUserReadingProgress(userId);

    res.status(200).json({
      success: true,
      data: progress,
      total: progress.length
    });
  } catch (error) {
    console.error('Error getting all reading progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reading progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Add a bookmark
 */
export const createBookmark = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ebookId, pageNumber, title, note } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!ebookId || !pageNumber) {
      res.status(400).json({
        success: false,
        message: 'ebookId and pageNumber are required'
      });
      return;
    }

    const bookmarkId = await addBookmark({
      userId,
      ebookId,
      pageNumber,
      title,
      note
    });

    res.status(201).json({
      success: true,
      data: { bookmarkId },
      message: 'Bookmark created successfully'
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bookmark',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get bookmarks for an ebook
 */
export const getEbookBookmarks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ebookId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!ebookId) {
      res.status(400).json({
        success: false,
        message: 'Ebook ID is required'
      });
      return;
    }

    const bookmarks = await getBookmarks(userId, ebookId);

    res.status(200).json({
      success: true,
      data: bookmarks,
      total: bookmarks.length
    });
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookmarks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a bookmark
 */
export const deleteBookmark = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bookmarkId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!bookmarkId) {
      res.status(400).json({
        success: false,
        message: 'Bookmark ID is required'
      });
      return;
    }

    await removeBookmark(bookmarkId, userId);

    res.status(200).json({
      success: true,
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bookmark',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Add a reading note
 */
export const createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ebookId, pageNumber, content, position } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!ebookId || !pageNumber || !content) {
      res.status(400).json({
        success: false,
        message: 'ebookId, pageNumber, and content are required'
      });
      return;
    }

    const noteId = await addReadingNote({
      userId,
      ebookId,
      pageNumber,
      content,
      position
    });

    res.status(201).json({
      success: true,
      data: { noteId },
      message: 'Note created successfully'
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get reading notes for an ebook
 */
export const getEbookNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ebookId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!ebookId) {
      res.status(400).json({
        success: false,
        message: 'Ebook ID is required'
      });
      return;
    }

    const notes = await getReadingNotes(userId, ebookId);

    res.status(200).json({
      success: true,
      data: notes,
      total: notes.length
    });
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a reading note
 */
export const updateNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { noteId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!noteId || !content) {
      res.status(400).json({
        success: false,
        message: 'Note ID and content are required'
      });
      return;
    }

    await updateReadingNote(noteId, userId, content);

    res.status(200).json({
      success: true,
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a reading note
 */
export const deleteNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { noteId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!noteId) {
      res.status(400).json({
        success: false,
        message: 'Note ID is required'
      });
      return;
    }

    await removeReadingNote(noteId, userId);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};