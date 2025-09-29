// src/services/reading-progress.service.ts
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { readingProgress, bookmarks, readingNotes } from '../db/schema/readingProgress';
import { nanoid } from 'nanoid';

export interface ReadingProgressData {
  userId: string;
  ebookId: string;
  currentPage: number;
  totalPages: number;
  timeSpentReading?: number;
}

export interface BookmarkData {
  userId: string;
  ebookId: string;
  pageNumber: number;
  title?: string;
  note?: string;
}

export interface ReadingNoteData {
  userId: string;
  ebookId: string;
  pageNumber: number;
  content: string;
  position?: string;
}

/**
 * Update or create reading progress for a user
 */
export const updateReadingProgress = async (data: ReadingProgressData) => {
  try {
    const progressPercentage = ((data.currentPage / data.totalPages) * 100).toFixed(2);

    // Check if progress already exists
    const existingProgress = await db
      .select()
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, data.userId),
          eq(readingProgress.ebookId, data.ebookId)
        )
      )
      .limit(1);

    if (existingProgress.length > 0) {
      // Update existing progress
      await db
        .update(readingProgress)
        .set({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          progressPercentage,
          lastReadAt: new Date(),
          timeSpentReading: data.timeSpentReading || existingProgress[0].timeSpentReading,
        })
        .where(
          and(
            eq(readingProgress.userId, data.userId),
            eq(readingProgress.ebookId, data.ebookId)
          )
        );

      return existingProgress[0].id;
    } else {
      // Create new progress record
      const progressId = nanoid();
      await db.insert(readingProgress).values({
        id: progressId,
        userId: data.userId,
        ebookId: data.ebookId,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        progressPercentage,
        timeSpentReading: data.timeSpentReading || 0,
      });

      return progressId;
    }
  } catch (error) {
    console.error('Error updating reading progress:', error);
    throw error;
  }
};

/**
 * Get reading progress for a user and ebook
 */
export const getReadingProgress = async (userId: string, ebookId: string) => {
  try {
    const progress = await db
      .select()
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.ebookId, ebookId)
        )
      )
      .limit(1);

    return progress[0] || null;
  } catch (error) {
    console.error('Error getting reading progress:', error);
    throw error;
  }
};

/**
 * Get all reading progress for a user
 */
export const getUserReadingProgress = async (userId: string) => {
  try {
    const progress = await db
      .select()
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.lastReadAt));

    return progress;
  } catch (error) {
    console.error('Error getting user reading progress:', error);
    throw error;
  }
};

/**
 * Add a bookmark
 */
export const addBookmark = async (data: BookmarkData) => {
  try {
    const bookmarkId = nanoid();
    await db.insert(bookmarks).values({
      id: bookmarkId,
      userId: data.userId,
      ebookId: data.ebookId,
      pageNumber: data.pageNumber,
      title: data.title,
      note: data.note,
    });

    return bookmarkId;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
};

/**
 * Get bookmarks for an ebook
 */
export const getBookmarks = async (userId: string, ebookId: string) => {
  try {
    const userBookmarks = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.ebookId, ebookId)
        )
      )
      .orderBy(bookmarks.pageNumber);

    return userBookmarks;
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    throw error;
  }
};

/**
 * Remove a bookmark
 */
export const removeBookmark = async (bookmarkId: string, userId: string) => {
  try {
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.id, bookmarkId),
          eq(bookmarks.userId, userId)
        )
      );
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
};

/**
 * Add a reading note
 */
export const addReadingNote = async (data: ReadingNoteData) => {
  try {
    const noteId = nanoid();
    await db.insert(readingNotes).values({
      id: noteId,
      userId: data.userId,
      ebookId: data.ebookId,
      pageNumber: data.pageNumber,
      content: data.content,
      position: data.position,
    });

    return noteId;
  } catch (error) {
    console.error('Error adding reading note:', error);
    throw error;
  }
};

/**
 * Get reading notes for an ebook
 */
export const getReadingNotes = async (userId: string, ebookId: string) => {
  try {
    const notes = await db
      .select()
      .from(readingNotes)
      .where(
        and(
          eq(readingNotes.userId, userId),
          eq(readingNotes.ebookId, ebookId)
        )
      )
      .orderBy(readingNotes.pageNumber);

    return notes;
  } catch (error) {
    console.error('Error getting reading notes:', error);
    throw error;
  }
};

/**
 * Update a reading note
 */
export const updateReadingNote = async (noteId: string, userId: string, content: string) => {
  try {
    await db
      .update(readingNotes)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(readingNotes.id, noteId),
          eq(readingNotes.userId, userId)
        )
      );
  } catch (error) {
    console.error('Error updating reading note:', error);
    throw error;
  }
};

/**
 * Remove a reading note
 */
export const removeReadingNote = async (noteId: string, userId: string) => {
  try {
    await db
      .delete(readingNotes)
      .where(
        and(
          eq(readingNotes.id, noteId),
          eq(readingNotes.userId, userId)
        )
      );
  } catch (error) {
    console.error('Error removing reading note:', error);
    throw error;
  }
};