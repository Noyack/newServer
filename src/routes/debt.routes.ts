import express from 'express';
import * as debtsController from '../controllers/debts.controller';
import * as debtDetailsController from '../controllers/debtDetails.controller';
import * as debtStrategiesController from '../controllers/debtStrategies.controller';

const router = express.Router();

// Debts Routes
router.get('/users/:userId/debts', debtsController.getDebts);
router.get('/debts/:id', debtsController.getDebt);
router.post('/users/:userId/debts', debtsController.createDebt);
router.patch('/debts/:id', debtsController.updateDebt);
router.delete('/debts/:id', debtsController.deleteDebt);

// Debt Details Routes
router.get('/debts/:debtId/details', debtDetailsController.getDebtDetails);
router.post('/debts/:debtId/details', debtDetailsController.createDebtDetail);
router.patch('/debt-details/:id', debtDetailsController.updateDebtDetail);
router.delete('/debt-details/:id', debtDetailsController.deleteDebtDetail);
router.post('/debts/:debtId/details/bulk', debtDetailsController.bulkUpsertDebtDetails);

// Debt Strategies Routes
router.get('/users/:userId/debt-strategy', debtStrategiesController.getDebtStrategy);
router.post('/users/:userId/debt-strategy', debtStrategiesController.createDebtStrategy);
router.patch('/debt-strategy/:id', debtStrategiesController.updateDebtStrategy);
router.delete('/debt-strategy/:id', debtStrategiesController.deleteDebtStrategy);

export default router;