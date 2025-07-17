import express from 'express';
import basicFinancialRoutes from './basicFinancial.routes';
import assetsRoutes from './assets.routes';
import debtsRoutes from './debt.routes';
import expensesRoutes from './expenses.routes';
import SubscriptionRoutes from './subscription.routes';

const router = express.Router();

// API versioning

// Register all routes
router.use(basicFinancialRoutes);
router.use(assetsRoutes);
router.use(debtsRoutes);
router.use(expensesRoutes);
router.use(SubscriptionRoutes);

export default router;