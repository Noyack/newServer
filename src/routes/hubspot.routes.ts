// src/routes/hubspot.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  // Webhook handlers
  handleHubspotWebhook,
  
  // Contact controllers
  createContact,
  getContact,
  updateContact,
  searchContacts,
  getAllContacts,
  addContactToList,
  removeContactFromList,
  syncUser,
  
  // Deal controllers
  createDeal,
  getDeal,
  updateDeal,
  getAllDeals,
  searchDeals,
  getDealsForContact,
  getDealPipelines,
  getDealStages,
  
  // Marketing controllers
  getEventsSummary,
  getAllEvents,
  
  // Activity controllers
  logActivity,
  createHubSpotSupportTicket,
  getUserSupportTickets,
} from '../controllers/hubspot.controller';
import express from 'express';
import { getAllEbooks, getEbookMetadata, getEbooksByFolder, searchEbooks, streamEbookPageController } from '../controllers/ebooks.controller';
import { getAllInvestmentReports, getInvestmentReportMetadataController, getInvestmentReportsByFolder, searchInvestmentReports, streamInvestmentReportPageController } from '../controllers/investment-reports.controller';
import {
  updateProgress,
  getProgress,
  getAllProgress,
  createBookmark,
  getEbookBookmarks,
  deleteBookmark,
  createNote,
  getEbookNotes,
  updateNote,
  deleteNote,
} from '../controllers/reading-progress.controller';

const router = Router();

// ============================================================================
// WEBHOOK ROUTES (No auth required)
// ============================================================================
router.post('/webhook', express.raw({ type: 'application/json' }), handleHubspotWebhook);

// ============================================================================
// CONTACT ROUTES (Protected - require authentication)
// ============================================================================
router.post('/contacts', createContact);
router.get('/contacts/:contactId', getContact);
router.patch('/contacts/:contactId', updateContact);
router.get('/contacts', getAllContacts);
router.post('/contacts/search', searchContacts);
router.post('/contacts/add-to-list', addContactToList);
router.post('/contacts/remove-from-list', removeContactFromList);
router.post('/contacts/sync-user', syncUser); // Legacy endpoint

// ============================================================================
// EBOOKS ROUTES (Protected - require authentication)
// ============================================================================
// Get all ebooks from the "ALL FINAL EBOOKS" folder (no download URLs)
router.get('/ebooks', requireAuth, getAllEbooks);

// Search ebooks by name (no download URLs)
router.get('/ebooks/search', requireAuth, searchEbooks);

// Get ebooks from a specific folder (no download URLs)
router.get('/ebooks/folder/:folderName', requireAuth, getEbooksByFolder);

// NEW: Get ebook metadata (page count, format, etc.)
router.get('/ebooks/:fileId/metadata', requireAuth, getEbookMetadata);

// NEW: Stream a specific page of an ebook
router.get('/ebooks/:fileId/stream', requireAuth, streamEbookPageController);

// ============================================================================
// INVESTMENT REPORTS ROUTES (Protected - require authentication)
// ============================================================================
// Get all investment reports from the "2025 Investment Reports PDFs" folder (no download URLs)
router.get('/investment-reports', requireAuth, getAllInvestmentReports);

// Search investment reports by name (no download URLs)
router.get('/investment-reports/search', requireAuth, searchInvestmentReports);

// Get investment reports from a specific folder (no download URLs)
router.get('/investment-reports/folder/:folderName', requireAuth, getInvestmentReportsByFolder);

// Get investment report metadata (page count, format, etc.)
router.get('/investment-reports/:fileId/metadata', requireAuth, getInvestmentReportMetadataController);

// Stream a specific page of an investment report
router.get('/investment-reports/:fileId/stream', requireAuth, streamInvestmentReportPageController);

// ============================================================================
// READING PROGRESS ROUTES (Protected - require authentication)
// ============================================================================
// Update reading progress
router.post('/ebooks/progress', requireAuth, updateProgress);

// Get reading progress for specific ebook
router.get('/ebooks/:ebookId/progress', requireAuth, getProgress);

// Get all reading progress for user
router.get('/reading-progress', requireAuth, getAllProgress);

// ============================================================================
// BOOKMARK ROUTES (Protected - require authentication)
// ============================================================================
// Create bookmark
router.post('/ebooks/bookmarks', requireAuth, createBookmark);

// Get bookmarks for ebook
router.get('/ebooks/:ebookId/bookmarks', requireAuth, getEbookBookmarks);

// Delete bookmark
router.delete('/ebooks/bookmarks/:bookmarkId', requireAuth, deleteBookmark);

// ============================================================================
// READING NOTES ROUTES (Protected - require authentication)
// ============================================================================
// Create note
router.post('/ebooks/notes', requireAuth, createNote);

// Get notes for ebook
router.get('/ebooks/:ebookId/notes', requireAuth, getEbookNotes);

// Update note
router.patch('/ebooks/notes/:noteId', requireAuth, updateNote);

// Delete note
router.delete('/ebooks/notes/:noteId', requireAuth, deleteNote);

// ============================================================================
// DEAL ROUTES (Protected - require authentication)
// ============================================================================
router.post('/deals', createDeal);
router.get('/deals/:dealId', getDeal);
router.patch('/deals/:dealId', updateDeal);
router.get('/deals', getAllDeals);
router.post('/deals/search', searchDeals);
router.get('/contacts/:contactId/deals', getDealsForContact);
router.get('/pipelines/deals', getDealPipelines);
router.get('/pipelines/deals/:pipelineId/stages', getDealStages);

// ============================================================================
// MARKETING EVENT ROUTES (Protected - require authentication)
// ============================================================================
router.get('/marketing/events/summary', getEventsSummary);
router.get('/marketing/events', getAllEvents);

// ============================================================================
// SUPPORT TICKET ROUTES (Protected - require authentication)
// ============================================================================
router.post('/tickets', createHubSpotSupportTicket);
router.get('/tickets', getUserSupportTickets); // Query with ?email=user@example.com

// ============================================================================
// ACTIVITY ROUTES (Protected - require authentication)
// ============================================================================
router.post('/activities', logActivity);

// ============================================================================
// LEGACY ROUTES (For backward compatibility)
// ============================================================================
router.post('/sync-user', syncUser);
router.post('/create-deal', createDeal);
router.get('/summaryevents', getEventsSummary);
router.get('/allevents', getAllEvents);

export default router;