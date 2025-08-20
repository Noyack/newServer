import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import express from 'express';
import { account, createLink, createUserToken, exchangeToken, getInfo, holdings, identify, incomeCheck, liabilities, transactions } from '../controllers/plaid.controller';

const router = Router();

// Protected routes requiring authentication
router.post('/create_link_token', createLink );
router.post('/exchange_public_token', exchangeToken);
router.post('/create_user_token', createUserToken)
router.get('/accounts', account);
router.get('/transactions', getInfo)
router.get('/identity', identify)
router.get('/income', incomeCheck)
router.get('/holdings', holdings)
router.get('/investtransactions', transactions)
router.get('/liabilities', liabilities)



export default router;