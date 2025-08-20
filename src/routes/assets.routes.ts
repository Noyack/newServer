// assets.routes.ts - Simplified routes
import express from 'express';
import * as assetsController from '../controllers/assets.controller';

const router = express.Router();

// Main routes that align with frontend
router.get('/users/:userId/assets', assetsController.getUserAssets);
router.post('/users/:userId/assets', assetsController.createAsset);
router.patch('/assets/:id', assetsController.updateAsset);
router.delete('/assets/:id', assetsController.deleteAsset);
router.get('/assets/:id', assetsController.getAsset);

// Bulk save endpoint
router.post('/users/:userId/assets-and-allocations', assetsController.saveAssetsAndAllocations);

export default router;