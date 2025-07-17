import express from 'express';
import * as incomeSourcesController from '../controllers/incomeSources.controller';
import * as emergencyFundsController from '../controllers/emergencyFunds.controller';
import * as emergencySavingsAccountsController from '../controllers/emergencySavingsAccounts.controller';
import * as basicInfoController from '../controllers/basicInfo.controller';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Basic Info Routes
router.get('/users/:userId/basic-info', basicInfoController.getBasicInfo);
router.post('/users/:userId/basic-info', basicInfoController.createBasicInfo);
router.patch('/basic-info/:id', basicInfoController.updateBasicInfo);
router.delete('/basic-info/:id', basicInfoController.deleteBasicInfo);

// Income Sources Routes
router.get('/users/:userId/income-sources', incomeSourcesController.getIncomeSources);
router.get('/income-sources/:id', incomeSourcesController.getIncomeSource);
router.post('/users/:userId/income-sources', incomeSourcesController.createIncomeSource);
router.patch('/income-sources/:id', incomeSourcesController.updateIncomeSource);
router.delete('/income-sources/:id', incomeSourcesController.deleteIncomeSource);

// Emergency Funds Routes
router.get('/users/:userId/emergency-fund', emergencyFundsController.getEmergencyFund);
router.post('/users/:userId/emergency-fund', emergencyFundsController.createEmergencyFund);
router.patch('/emergency-fund/:id', emergencyFundsController.updateEmergencyFund);
router.delete('/emergency-fund/:id', emergencyFundsController.deleteEmergencyFund);

// Emergency Savings Accounts Routes
router.get('/emergency-fund/:fundId/savings-accounts', emergencySavingsAccountsController.getEmergencySavingsAccounts);
router.get('/emergency-savings-account/:id', emergencySavingsAccountsController.getEmergencySavingsAccount);
router.post('/emergency-fund/:fundId/savings-accounts', emergencySavingsAccountsController.createEmergencySavingsAccount);
router.patch('/emergency-savings-account/:id', emergencySavingsAccountsController.updateEmergencySavingsAccount);
router.delete('/emergency-savings-account/:id', emergencySavingsAccountsController.deleteEmergencySavingsAccount);

export default router;