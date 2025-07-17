import express from 'express';
import * as assetsController from '../controllers/assets.controller';
import * as assetDetailsController from '../controllers/assetDetails.controller';
import * as assetAllocationsController from '../controllers/assetAllocations.controller';

const router = express.Router();

// Assets Routes
router.get('/users/:userId/assets', assetsController.getAssets);
router.get('/assets/:id', assetsController.getAsset);
router.post('/users/:userId/assets', assetsController.createAsset);
router.patch('/assets/:id', assetsController.updateAsset);
router.delete('/assets/:id', assetsController.deleteAsset);

// Asset Details Routes
router.get('/assets/:assetId/details', assetDetailsController.getAssetDetails);
router.post('/assets/:assetId/details', assetDetailsController.createAssetDetail);
router.patch('/asset-details/:id', assetDetailsController.updateAssetDetail);
router.delete('/asset-details/:id', assetDetailsController.deleteAssetDetail);
router.post('/assets/:assetId/details/bulk', assetDetailsController.bulkUpsertAssetDetails);

// Asset Allocations Routes
router.get('/users/:userId/asset-allocations', assetAllocationsController.getAssetAllocations);
router.get('/asset-allocations/:id', assetAllocationsController.getAssetAllocation);
router.post('/users/:userId/asset-allocations', assetAllocationsController.createAssetAllocation);
router.patch('/asset-allocations/:id', assetAllocationsController.updateAssetAllocation);
router.delete('/asset-allocations/:id', assetAllocationsController.deleteAssetAllocation);

export default router;