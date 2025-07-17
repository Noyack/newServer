import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import express from 'express';
import { account, createLink, createUserToken, exchangeToken, getInfo, holdings, identify, incomeCheck, liabilities, transactions } from '../controllers/plaid.controller';

const router = Router();

// Protected routes requiring authentication
router.post('/create_link_token', requireAuth, createLink );
router.post('/exchange_public_token', requireAuth, exchangeToken);
router.post('/create_user_token', requireAuth, createUserToken)
router.get('/accounts', requireAuth, account);
router.get('/transactions', requireAuth, getInfo)
router.get('/identity', requireAuth, identify)
router.get('/income', requireAuth, incomeCheck)
router.get('/holdings', requireAuth, holdings)
router.get('/investtransactions', requireAuth, transactions)
router.get('/liabilities', requireAuth, liabilities)



export default router;