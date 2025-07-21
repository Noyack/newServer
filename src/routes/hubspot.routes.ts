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

const router = Router();

// ============================================================================
// WEBHOOK ROUTES (No auth required)
// ============================================================================
router.post('/webhook', express.raw({ type: 'application/json' }), handleHubspotWebhook);

// ============================================================================
// CONTACT ROUTES (Protected - require authentication)
// ============================================================================
router.post('/contacts', requireAuth, createContact);
router.get('/contacts/:contactId', requireAuth, getContact);
router.patch('/contacts/:contactId', requireAuth, updateContact);
router.get('/contacts', requireAuth, getAllContacts);
router.post('/contacts/search', requireAuth, searchContacts);
router.post('/contacts/add-to-list', requireAuth, addContactToList);
router.post('/contacts/remove-from-list', requireAuth, removeContactFromList);
router.post('/contacts/sync-user', requireAuth, syncUser); // Legacy endpoint

// ============================================================================
// DEAL ROUTES (Protected - require authentication)
// ============================================================================
router.post('/deals', requireAuth, createDeal);
router.get('/deals/:dealId', requireAuth, getDeal);
router.patch('/deals/:dealId', requireAuth, updateDeal);
router.get('/deals', requireAuth, getAllDeals);
router.post('/deals/search', requireAuth, searchDeals);
router.get('/contacts/:contactId/deals', requireAuth, getDealsForContact);
router.get('/pipelines/deals', requireAuth, getDealPipelines);
router.get('/pipelines/deals/:pipelineId/stages', requireAuth, getDealStages);

// ============================================================================
// MARKETING EVENT ROUTES (Protected - require authentication)
// ============================================================================
router.get('/marketing/events/summary', requireAuth, getEventsSummary);
router.get('/marketing/events', requireAuth, getAllEvents);

// ============================================================================
// ACTIVITY ROUTES (Protected - require authentication)
// ============================================================================
router.post('/activities', requireAuth, logActivity);

// ============================================================================
// LEGACY ROUTES (For backward compatibility)
// ============================================================================
router.post('/sync-user', requireAuth, syncUser);
router.post('/create-deal', requireAuth, createDeal);
router.get('/summaryevents', requireAuth, getEventsSummary);
router.get('/allevents', requireAuth, getAllEvents);

export default router;