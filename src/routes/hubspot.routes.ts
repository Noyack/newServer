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
} from '../controllers/hubspot.controller';
import express from 'express';
import { getAllEbooks, getEbookDownloadUrl, getEbooksByFolder, searchEbooks } from '../controllers/ebooks.controller';

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
// EBOOKS ROUTES
// ============================================================================

// Get all ebooks from the "ALL FINAL EBOOKS" folder
router.get('/ebooks', getAllEbooks);

// Search ebooks by name
router.get('/ebooks/search', searchEbooks);

// Get ebooks from a specific folder
router.get('/ebooks/folder/:folderName', getEbooksByFolder);

// Get download URL for a specific ebook
router.get('/ebooks/:fileId/download', getEbookDownloadUrl);

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