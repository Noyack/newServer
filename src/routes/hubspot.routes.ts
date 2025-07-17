import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { handleHubspotWebhook, syncUser, createDeal, getEventsSummary, getAllEvents } from '../controllers/hubspot.controller';
import express from 'express';

const router = Router();

// Webhook route - no auth required
router.post('/webhook', express.raw({ type: 'application/json' }), handleHubspotWebhook);

// Protected routes requiring authentication
router.post('/sync-user', syncUser);
router.post('/create-deal', createDeal);
router.get('/summaryevents', getEventsSummary);
router.get('/allevents', getAllEvents);



export default router;