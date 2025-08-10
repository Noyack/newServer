// src/routes/auth.routes.ts
import { Router } from 'express';
import { handleClerkWebhook } from '../middleware/auth';
import express from 'express';

const router = Router();

// Important: For the webhook route, don't use the standard JSON middleware
router.post('/webhook', express.raw({type: 'application/json'}), handleClerkWebhook);
router.get('/webhook', (req, res) => {
  res.status(200).json({ message: "Webhook endpoint is working" });
});

export default router;