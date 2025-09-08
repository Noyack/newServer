// routes/equityTrust.routes.ts
import { Router } from 'express';
import { equityTrustController } from '../controllers/equityTrust.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All equity trust routes require authentication
router.use(requireAuth);

// Account management
router.post('/account/open', (req, res) => equityTrustController.openAccount(req, res));
router.get('/accounts/search', (req, res) => equityTrustController.getAccounts(req, res));
router.get('/accounts/:accountNumber/assets', (req, res) => equityTrustController.getAssets(req, res));
router.get('/accounts/:accountNumber/transactions', (req, res) => equityTrustController.getTransactions(req, res));

// Investment management
router.post('/investment/submit', (req, res) => equityTrustController.submitInvestment(req, res));

// Activity tracking
router.get('/activities', (req, res) => equityTrustController.getActivities(req, res));

export default router;