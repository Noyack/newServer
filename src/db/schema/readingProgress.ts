// src/db/schema/readingProgress.ts
import { mysqlTable, varchar, int, timestamp, text, decimal } from 'drizzle-orm/mysql-core';

export const readingProgress = mysqlTable('reading_progress', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  ebookId: varchar('ebook_id', { length: 255 }).notNull(),
  currentPage: int('current_page').notNull().default(1),
  totalPages: int('total_pages').notNull(),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2 }).notNull().default('0.00'),
  lastReadAt: timestamp('last_read_at').notNull().defaultNow(),
  timeSpentReading: int('time_spent_reading').notNull().default(0), // in seconds
  bookmarks: text('bookmarks'), // JSON string of bookmarked pages
  notes: text('notes'), // JSON string of user notes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const bookmarks = mysqlTable('bookmarks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  ebookId: varchar('ebook_id', { length: 255 }).notNull(),
  pageNumber: int('page_number').notNull(),
  title: varchar('title', { length: 255 }),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const readingNotes = mysqlTable('reading_notes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  ebookId: varchar('ebook_id', { length: 255 }).notNull(),
  pageNumber: int('page_number').notNull(),
  content: text('content').notNull(),
  position: text('position'), // JSON string for text selection position
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});