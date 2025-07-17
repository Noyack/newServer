// In your auth.routes.ts file
import { Router } from 'express';
import { clerkWebhookHandler } from '../middleware/auth';
import express from 'express';

const router = Router();

// Important: For the webhook route, don't use the standard JSON middleware
router.post('/webhook', express.raw({type: 'application/json'}), clerkWebhookHandler);
router.get('/webhook', ()=>console.log("ok"));
export default router;